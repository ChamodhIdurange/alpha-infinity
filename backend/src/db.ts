import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { DEFAULT_BANNERS, DEFAULT_CAMPAIGNS, DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from './defaults.js';
import type { Banner, Campaign, CatalogueData, Product, Settings } from './types.js';

export const OWNER = 'owner';

// Same schema as the original Python kit, so an existing data/alfa.db can be reused as-is.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, detail TEXT NOT NULL,
  description TEXT NOT NULL, image TEXT NOT NULL, badge TEXT NOT NULL DEFAULT '',
  price INTEGER, stock INTEGER, sizes TEXT NOT NULL, colors TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1, featured INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY, kicker TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
  cta TEXT NOT NULL, link TEXT NOT NULL, secondary TEXT NOT NULL,
  secondary_link TEXT NOT NULL, image TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY, eyebrow TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
  image TEXT NOT NULL, link TEXT NOT NULL, filter TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
`;

interface ProductRow extends Omit<Product, 'sizes' | 'colors' | 'active' | 'featured'> {
  sizes: string;
  colors: string;
  active: number;
  featured: number;
}

interface CampaignRow extends Omit<Campaign, 'active'> {
  active: number;
}

export interface SessionRow {
  token_hash: string;
  csrf: string;
  expires: number;
}

const toProduct = (row: ProductRow): Product => ({
  ...row,
  sizes: JSON.parse(row.sizes),
  colors: JSON.parse(row.colors),
  active: Boolean(row.active),
  featured: Boolean(row.featured),
});

const toCampaign = (row: CampaignRow): Campaign => ({ ...row, active: Boolean(row.active) });

const productParams = (p: Product) => ({
  ...p,
  sizes: JSON.stringify(p.sizes),
  colors: JSON.stringify(p.colors),
  active: Number(p.active),
  featured: Number(p.featured),
});

export type Repository = ReturnType<typeof createRepository>;

export function openDatabase(file: string): Database.Database {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file, { timeout: 15000 });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  seed(db);
  return db;
}

/** First run only: fill the empty catalogue with ALFA's concept content. */
function seed(db: Database.Database) {
  db.transaction(() => {
    const freshSeed = !db.prepare(`SELECT 1 FROM settings WHERE key='__seeded'`).get();
    const empty = (table: string) => !db.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get();
    if (freshSeed && empty('products')) {
      const insert = db.prepare(`INSERT INTO products VALUES (@id,@name,@category,@detail,@description,@image,@badge,@price,@stock,@sizes,@colors,@active,@featured,@position)`);
      DEFAULT_PRODUCTS.forEach((p, i) => insert.run(productParams({ ...p, active: true, featured: true, position: i })));
    }
    if (freshSeed && empty('campaigns')) {
      const insert = db.prepare(`INSERT INTO campaigns VALUES (@id,@kicker,@title,@description,@cta,@link,@secondary,@secondary_link,@image,@active)`);
      for (const c of DEFAULT_CAMPAIGNS) insert.run({ ...c, active: Number(c.active) });
    }
    if (freshSeed && empty('banners')) {
      const insert = db.prepare(`INSERT INTO banners VALUES (@id,@eyebrow,@title,@description,@image,@link,@filter)`);
      for (const b of DEFAULT_BANNERS) insert.run(b);
    }
    const setting = db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)');
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) setting.run(k, v);
    if (freshSeed) setting.run('__seeded', '1');
  })();
}

export function createRepository(db: Database.Database) {
  const settings = (): Settings => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    return Object.fromEntries(rows.filter((r) => !r.key.startsWith('__')).map((r) => [r.key, r.value]));
  };

  const catalogue = (publicOnly: boolean): CatalogueData => ({
    products: (db.prepare(`SELECT * FROM products ${publicOnly ? 'WHERE active=1' : ''} ORDER BY position, id`).all() as ProductRow[]).map(toProduct),
    campaigns: (db.prepare(`SELECT * FROM campaigns ${publicOnly ? 'WHERE active=1' : ''} ORDER BY id`).all() as CampaignRow[]).map(toCampaign),
    banners: db.prepare('SELECT * FROM banners ORDER BY id').all() as Banner[],
    settings: settings(),
  });

  return {
    db,
    publicData: () => catalogue(true),
    adminData: () => catalogue(false),

    upsertProduct(p: Product) {
      db.prepare(`INSERT INTO products VALUES (@id,@name,@category,@detail,@description,@image,@badge,@price,@stock,@sizes,@colors,@active,@featured,@position)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, detail=excluded.detail,
        description=excluded.description, image=excluded.image, badge=excluded.badge, price=excluded.price,
        stock=excluded.stock, sizes=excluded.sizes, colors=excluded.colors, active=excluded.active,
        featured=excluded.featured, position=excluded.position`).run(productParams(p));
    },

    deleteProduct: (id: string) => db.prepare('DELETE FROM products WHERE id=?').run(id).changes > 0,

    upsertCampaign(c: Campaign) {
      db.prepare(`INSERT INTO campaigns VALUES (@id,@kicker,@title,@description,@cta,@link,@secondary,@secondary_link,@image,@active)
        ON CONFLICT(id) DO UPDATE SET kicker=excluded.kicker, title=excluded.title, description=excluded.description,
        cta=excluded.cta, link=excluded.link, secondary=excluded.secondary, secondary_link=excluded.secondary_link,
        image=excluded.image, active=excluded.active`).run({ ...c, active: Number(c.active) });
    },

    upsertBanner(b: Banner) {
      db.prepare(`INSERT INTO banners VALUES (@id,@eyebrow,@title,@description,@image,@link,@filter)
        ON CONFLICT(id) DO UPDATE SET eyebrow=excluded.eyebrow, title=excluded.title, description=excluded.description,
        image=excluded.image, link=excluded.link, filter=excluded.filter`).run(b);
    },

    saveSettings(values: Settings) {
      const save = db.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
      db.transaction(() => {
        for (const [k, v] of Object.entries(values)) save.run(k, v);
      })();
    },

    passwordHash: (username: string) =>
      (db.prepare('SELECT password_hash FROM users WHERE username=?').get(username) as { password_hash: string } | undefined)?.password_hash,

    hasOwner: () => Boolean(db.prepare('SELECT 1 FROM users WHERE username=?').get(OWNER)),

    /** Sets the owner password and signs out every existing session. */
    setOwnerPasswordHash(hash: string) {
      db.transaction(() => {
        db.prepare('INSERT INTO users VALUES (?,?) ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash').run(OWNER, hash);
        db.prepare('DELETE FROM sessions').run();
      })();
    },

    createSession(tokenHash: string, csrf: string, expires: number) {
      db.prepare('DELETE FROM sessions WHERE expires<?').run(Math.floor(Date.now() / 1000));
      db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(tokenHash, csrf, expires);
    },

    findSession: (tokenHash: string) =>
      db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires>?').get(tokenHash, Math.floor(Date.now() / 1000)) as SessionRow | undefined,

    deleteSession: (tokenHash: string) => db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash),

    /** A transactionally consistent copy of the whole database file. */
    snapshot: () => db.serialize(),
  };
}
