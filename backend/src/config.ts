import path from 'node:path';

export interface Config {
  port: number;
  host: string;
  dataDir: string;
  uploadDir: string;
  frontendDist: string;
  /** Value for Express "trust proxy": false, a hop count, or a preset such as "loopback". */
  trustProxy: boolean | number | string;
}

/** backend/ — resolves the same from src/ (tsx) and dist/ (compiled). */
export const BACKEND_ROOT = path.resolve(import.meta.dirname, '..');

function parseTrustProxy(value: string | undefined): Config['trustProxy'] {
  if (value === undefined || value === '') return 'loopback';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  try {
    process.loadEnvFile(path.join(BACKEND_ROOT, '.env'));
  } catch {
    // No .env file: rely on the real environment.
  }
  return {
    port: Number(env.PORT || 8000),
    host: env.HOST || '127.0.0.1',
    dataDir: path.resolve(env.ALFA_DATA_DIR || path.join(BACKEND_ROOT, 'data')),
    uploadDir: path.resolve(env.ALFA_UPLOAD_DIR || path.join(BACKEND_ROOT, 'uploads')),
    frontendDist: path.resolve(env.ALFA_FRONTEND_DIST || path.join(BACKEND_ROOT, '..', 'frontend', 'dist')),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
  };
}
