import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Repository } from '../db.js';

/** The storefront HTML carries this empty slot; the server fills it with live catalogue data. */
export const DATA_SLOT = '<script id="alfa-data" type="application/json">null</script>';

const embedJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/**
 * Serves the built React site. The storefront HTML is rendered per request with the
 * catalogue embedded, so visitors see current products and campaigns on first paint
 * without a second round trip.
 */
export function siteRouter(repo: Repository, frontendDist: string) {
  const router = express.Router();
  const indexFile = path.join(frontendDist, 'index.html');
  const adminFile = path.join(frontendDist, 'admin.html');

  if (!fs.existsSync(indexFile)) {
    router.get('/', (_req, res) => {
      res.type('text').send('ALFA API is running. The React site is not built yet: run "npm run build", or use "npm run dev" and open http://localhost:5173.');
    });
    return router;
  }

  const template = fs.readFileSync(indexFile, 'utf8');
  if (!template.includes(DATA_SLOT)) throw new Error(`${indexFile} is missing the alfa-data slot.`);

  router.get(['/', '/index.html'], (_req, res) => {
    const html = template.replace(DATA_SLOT, () => DATA_SLOT.replace('>null<', `>${embedJson(repo.publicData())}<`));
    res.set('Cache-Control', 'no-store').type('html').send(html);
  });

  router.get('/admin', (_req, res) => {
    res.set('Cache-Control', 'no-store').sendFile(adminFile);
  });
  router.get('/admin.html', (_req, res) => res.redirect(301, '/admin'));

  router.use(
    express.static(frontendDist, {
      index: false,
      setHeaders(res, file) {
        // Vite fingerprints everything under static/, so those files never change.
        const fingerprinted = file.includes(`${path.sep}static${path.sep}`);
        res.setHeader('Cache-Control', fingerprinted ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
      },
    }),
  );

  return router;
}
