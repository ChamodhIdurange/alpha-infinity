/**
 * Owner account tools.
 *   npm run set-password            (development, from the repo root)
 *   node dist/cli.js set-password   (production build)
 *   node dist/cli.js has-admin      (exit code 0 when a password is set)
 * Set ALFA_OWNER_PASSWORD to set the password non-interactively (e.g. in a container).
 */
import path from 'node:path';
import readline from 'node:readline';
import { ownerPasswordHash } from './auth.js';
import { loadConfig } from './config.js';
import { OWNER, createRepository, openDatabase } from './db.js';

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl as unknown as { _writeToOutput: (s: string) => void };
    let prompted = false;
    output._writeToOutput = (s: string) => {
      // Print the prompt once, then hide what is typed.
      if (!prompted) {
        process.stdout.write(s);
        prompted = true;
      }
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main(): Promise<number> {
  const command = process.argv[2];
  if (command !== 'set-password' && command !== 'has-admin') {
    console.log('Usage: cli set-password | has-admin');
    return 1;
  }
  const config = loadConfig();
  const dbFile = path.join(config.dataDir, 'alfa.db');
  const db = openDatabase(dbFile);
  const repo = createRepository(db);
  try {
    if (command === 'has-admin') return repo.hasOwner() ? 0 : 1;

    let password = process.env.ALFA_OWNER_PASSWORD;
    if (!password) {
      password = await askHidden('New ALFA owner password (12+ characters): ');
      const again = await askHidden('Repeat password: ');
      if (password !== again) {
        console.log('Passwords do not match.');
        return 1;
      }
    }
    try {
      repo.setOwnerPasswordHash(await ownerPasswordHash(password));
    } catch (err) {
      console.log(err instanceof Error ? err.message : err);
      return 1;
    }
    console.log(`Owner login configured. Username: ${OWNER}. Existing admin sessions were signed out.`);
    console.log('Database:', dbFile);
    return 0;
  } finally {
    db.close();
  }
}

process.exitCode = await main();
