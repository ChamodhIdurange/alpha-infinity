import path from 'node:path';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createRepository, openDatabase } from './db.js';

const config = loadConfig();
const db = openDatabase(path.join(config.dataDir, 'alfa.db'));
const repo = createRepository(db);
const app = createApp(repo, config);

if (!repo.hasOwner()) {
  console.warn('No owner password yet. Run "npm run set-password" (or "node backend/dist/cli.js set-password" on a server) before using /admin.');
}

const server = app.listen(config.port, config.host, () => {
  console.log(`ALFA store running at http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`);
  console.log(`Data: ${config.dataDir}  Uploads: ${config.uploadDir}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down.`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
