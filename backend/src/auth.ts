import crypto from 'node:crypto';
import { promisify } from 'node:util';
import type { NextFunction, Request, Response } from 'express';
import type { Repository, SessionRow } from './db.js';
import { HttpError } from './validation.js';

const scrypt = promisify(crypto.scrypt) as (password: string, salt: Buffer, keylen: number, options: crypto.ScryptOptions) => Promise<Buffer>;

export const SESSION_COOKIE = 'alfa_owner';
export const SESSION_TTL_SECONDS = 7 * 24 * 3600;
export const MIN_PASSWORD_LENGTH = 12;

// Format matches the original Python kit (hashlib.scrypt, 64-byte key), so existing owner passwords keep working.
const N = 16384, R = 8, P = 1, KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const digest = await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return `scrypt:${N}:${R}:${P}:${salt.toString('hex')}:${digest.toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string | undefined): Promise<boolean> {
  const parts = encoded?.split(':') ?? [];
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, salt, digest] = parts;
  try {
    const expected = Buffer.from(digest, 'hex');
    const candidate = await scrypt(password, Buffer.from(salt, 'hex'), expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 256 * 1024 * 1024,
    });
    return crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

/** Hash a password for the owner account, enforcing the minimum length. */
export async function ownerPasswordHash(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Choose an admin password with at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return hashPassword(password);
}

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
export const newToken = () => crypto.randomBytes(32).toString('base64url');

export function sessionFor(repo: Repository, req: Request): SessionRow | undefined {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string' || !token || token.length > 200) return undefined;
  return repo.findSession(hashToken(token));
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: SessionRow;
  }
}

/**
 * Requires a signed-in owner. Requests that change data must also echo the
 * session's CSRF token in the X-CSRF-Token header.
 */
export function requireOwner(repo: Repository, { mutation }: { mutation: boolean }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const session = sessionFor(repo, req);
    if (!session) return next(new HttpError(401, 'Please sign in to ALFA admin.'));
    if (mutation) {
      const sent = Buffer.from(req.get('x-csrf-token') ?? '');
      const expected = Buffer.from(session.csrf);
      if (sent.length !== expected.length || !crypto.timingSafeEqual(sent, expected)) {
        return next(new HttpError(403, 'Session verification failed. Refresh the admin page.'));
      }
    }
    req.session = session;
    next();
  };
}
