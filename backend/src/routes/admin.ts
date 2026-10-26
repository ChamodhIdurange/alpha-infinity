import express from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import type { Repository } from '../db.js';
import {
  SESSION_COOKIE, SESSION_TTL_SECONDS, hashPassword, hashToken, newToken, requireOwner, sessionFor, verifyPassword,
} from '../auth.js';
import { MAX_VIDEO_BYTES, storeUpload } from '../media.js';
import { HttpError, checkedBanner, checkedCampaign, checkedProduct, checkedSettings } from '../validation.js';

const csvCell = (value: unknown) => {
  const s = value == null ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

const stamp = () => new Date().toISOString().slice(0, 10);

// Compared against when the username is unknown, so a miss costs the same time as a wrong password.
const dummyHash = hashPassword(newToken());

export function adminRouter(repo: Repository, uploadDir: string) {
  const router = express.Router();
  const owner = requireOwner(repo, { mutation: false });
  const ownerMutation = requireOwner(repo, { mutation: true });
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_VIDEO_BYTES, files: 1 } });

  // 10 failed sign-ins per address per 15 minutes; successful ones don't count.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ detail: 'Too many attempts. Try again later.' }),
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof username !== 'string' || typeof password !== 'string' || password.length > 1024) {
      throw new HttpError(422, 'Enter your username and password.');
    }
    const stored = repo.passwordHash(username.trim());
    const valid = await verifyPassword(password, stored ?? (await dummyHash));
    if (!stored || !valid) throw new HttpError(401, 'Login details did not match. Please try again.');

    const token = newToken();
    repo.createSession(hashToken(token), newToken(), Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: req.secure,
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS * 1000,
      path: '/',
    });
    res.json({ ok: true });
  });

  router.get('/session', (req, res) => {
    res.json({ authenticated: Boolean(sessionFor(repo, req)) });
  });

  router.post('/logout', ownerMutation, (req, res) => {
    repo.deleteSession(req.session!.token_hash);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  router.get('/data', owner, (req, res) => {
    res.json({ ...repo.adminData(), csrf: req.session!.csrf });
  });

  router.post('/products', ownerMutation, (req, res) => {
    const product = checkedProduct(req.body);
    repo.upsertProduct(product);
    res.json({ ok: true, id: product.id });
  });

  router.delete('/products/:id', ownerMutation, (req, res) => {
    if (!repo.deleteProduct(String(req.params.id))) throw new HttpError(404, 'Product not found.');
    res.json({ ok: true });
  });

  router.post('/campaigns', ownerMutation, (req, res) => {
    repo.upsertCampaign(checkedCampaign(req.body));
    res.json({ ok: true });
  });

  router.post('/banners', ownerMutation, (req, res) => {
    repo.upsertBanner(checkedBanner(req.body));
    res.json({ ok: true });
  });

  router.post('/settings', ownerMutation, (req, res) => {
    repo.saveSettings(checkedSettings(req.body));
    res.json({ ok: true });
  });

  router.post('/upload', ownerMutation, upload.single('file'), async (req, res) => {
    if (!req.file) throw new HttpError(422, 'Choose an image or video first.');
    const path = await storeUpload(uploadDir, req.file.originalname, req.file.buffer);
    res.json({ ok: true, path });
  });

  router.get('/backup', owner, (_req, res) => {
    res.set({
      'Content-Type': 'application/x-sqlite3',
      'Content-Disposition': `attachment; filename="alfa-backup-${stamp()}.sqlite3"`,
    });
    res.send(repo.snapshot());
  });

  router.get('/catalogue.csv', owner, (_req, res) => {
    const rows = [['SKU', 'Name', 'Category', 'Price LKR', 'Status', 'Stock', 'Description', 'Image']];
    for (const p of repo.adminData().products) {
      rows.push([p.id, p.name, p.category, p.price ?? '', p.active ? 'Published' : 'Draft', p.stock ?? '', p.description, p.image].map(String));
    }
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="alfa-products-${stamp()}.csv"`,
    });
    // Leading BOM so Excel opens "Piqué" and "·" correctly.
    res.send('﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n');
  });

  return router;
}
