import fs from 'node:fs';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import multer from 'multer';
import type { Config } from './config.js';
import type { Repository } from './db.js';
import { adminRouter } from './routes/admin.js';
import { siteRouter } from './routes/site.js';
import { HttpError } from './validation.js';

type AppOptions = Pick<Config, 'uploadDir' | 'frontendDist' | 'trustProxy'>;

export function createApp(repo: Repository, options: AppOptions) {
  fs.mkdirSync(options.uploadDir, { recursive: true });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          // React sets inline style attributes (hero backgrounds, colour swatches).
          styleSrc: ["'self'", "'unsafe-inline'"],
          // Products, campaigns and the workshop video may point at HTTPS URLs.
          imgSrc: ["'self'", 'data:', 'https:'],
          mediaSrc: ["'self'", 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.path.startsWith('/admin') || req.path.startsWith('/api/admin')) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '200kb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/api/storefront', (_req, res) => {
    res.set('Cache-Control', 'no-store').json(repo.publicData());
  });
  app.use('/api/admin', adminRouter(repo, options.uploadDir));
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')));

  // Upload names are random and never reused, so they can be cached for good.
  app.use('/uploads', express.static(options.uploadDir, { index: false, dotfiles: 'deny', immutable: true, maxAge: '365d' }));

  app.use(siteRouter(repo, options.frontendDist));

  app.use((_req, res) => {
    res.status(404).type('text').send('Not found');
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    let status = 500;
    let detail = 'Something went wrong. Please try again.';
    if (err instanceof HttpError) {
      status = err.status;
      detail = err.message;
    } else if (err instanceof multer.MulterError) {
      status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 422;
      detail = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (images 9MB, videos 40MB).' : 'Upload one file at a time.';
    } else if (err?.type === 'entity.parse.failed') {
      status = 400;
      detail = 'Invalid request.';
    } else if (err?.type === 'entity.too.large') {
      status = 413;
      detail = 'Request is too large.';
    } else {
      console.error(err);
    }
    res.status(status).json({ detail });
  };
  app.use(errorHandler);

  return app;
}
