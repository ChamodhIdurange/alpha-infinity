import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import sharp from 'sharp';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { hashPassword, ownerPasswordHash, verifyPassword } from '../src/auth.js';
import { createRepository, openDatabase } from '../src/db.js';
import { DATA_SLOT } from '../src/routes/site.js';

const PASSWORD = 'correct horse battery';

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alfa-test-'));
  const dist = path.join(dir, 'dist');
  fs.mkdirSync(dist);
  fs.writeFileSync(path.join(dist, 'index.html'), `<html><head>${DATA_SLOT}</head><body></body></html>`);
  fs.writeFileSync(path.join(dist, 'admin.html'), '<html>admin</html>');
  const db = openDatabase(path.join(dir, 'alfa.db'));
  const repo = createRepository(db);
  const app = createApp(repo, { uploadDir: path.join(dir, 'uploads'), frontendDist: dist, trustProxy: false });
  return { dir, db, repo, app };
}

async function signIn(app: ReturnType<typeof setup>['app']) {
  const agent = request.agent(app);
  await agent.post('/api/admin/login').send({ username: 'owner', password: PASSWORD }).expect(200);
  const { body } = await agent.get('/api/admin/data').expect(200);
  return { agent, csrf: body.csrf as string };
}

const product = {
  id: 'alfa-test-01', category: 'Polos', name: 'Test Polo', detail: 'Short', description: 'Long',
  image: 'assets/polo-forest.png', badge: 'NEW', price: '4500', stock: 3, position: 9,
  sizes: ['M', 'L'], colors: [{ name: 'Forest', hex: '#164535' }], active: true, featured: true,
};

describe('ALFA API', () => {
  let ctx: ReturnType<typeof setup>;

  before(async () => {
    ctx = setup();
    ctx.repo.setOwnerPasswordHash(await ownerPasswordHash(PASSWORD));
  });
  after(() => {
    ctx.db.close();
    fs.rmSync(ctx.dir, { recursive: true, force: true });
  });

  test('seeds the catalogue and serves it publicly', async () => {
    const { body } = await request(ctx.app).get('/api/storefront').expect(200);
    assert.equal(body.products.length, 5);
    assert.equal(body.campaigns.length, 3);
    assert.equal(body.banners.length, 3);
    assert.equal(body.settings.phone, '94710910951');
    assert.equal(body.settings.__seeded, undefined);
  });

  test('embeds live catalogue data in the storefront HTML', async () => {
    const res = await request(ctx.app).get('/').expect(200);
    assert.match(res.text, /<script id="alfa-data" type="application\/json">\{"products":/);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.match(res.headers['content-security-policy'], /script-src 'self'/);
  });

  test('admin endpoints require a session', async () => {
    await request(ctx.app).get('/api/admin/data').expect(401);
    const { body } = await request(ctx.app).get('/api/admin/session').expect(200);
    assert.equal(body.authenticated, false);
  });

  test('rejects a wrong password', async () => {
    const res = await request(ctx.app).post('/api/admin/login').send({ username: 'owner', password: 'not the password' }).expect(401);
    assert.equal(res.body.detail, 'Login details did not match. Please try again.');
  });

  test('signs in with an httpOnly cookie and rejects mutations without CSRF', async () => {
    const agent = request.agent(ctx.app);
    const login = await agent.post('/api/admin/login').send({ username: 'owner', password: PASSWORD }).expect(200);
    assert.match(String(login.headers['set-cookie']), /alfa_owner=.*HttpOnly.*SameSite=Lax/i);
    assert.equal((await agent.get('/api/admin/session')).body.authenticated, true);
    await agent.post('/api/admin/products').send(product).expect(403);
  });

  test('creates, publishes and deletes a product', async () => {
    const { agent, csrf } = await signIn(ctx.app);
    const saved = await agent.post('/api/admin/products').set('X-CSRF-Token', csrf).send(product).expect(200);
    assert.equal(saved.body.id, 'ALFA-TEST-01');

    const { body } = await request(ctx.app).get('/api/storefront');
    const stored = body.products.find((p: { id: string }) => p.id === 'ALFA-TEST-01');
    assert.equal(stored.price, 4500);
    assert.deepEqual(stored.sizes, ['M', 'L']);

    await agent.post('/api/admin/products').set('X-CSRF-Token', csrf).send({ ...product, active: false }).expect(200);
    const hidden = await request(ctx.app).get('/api/storefront');
    assert.equal(hidden.body.products.some((p: { id: string }) => p.id === 'ALFA-TEST-01'), false);

    await agent.delete('/api/admin/products/ALFA-TEST-01').set('X-CSRF-Token', csrf).expect(200);
    await agent.delete('/api/admin/products/ALFA-TEST-01').set('X-CSRF-Token', csrf).expect(404);
  });

  test('validates product, campaign and settings input', async () => {
    const { agent, csrf } = await signIn(ctx.app);
    const post = (url: string, body: object) => agent.post(url).set('X-CSRF-Token', csrf).send(body);

    assert.equal((await post('/api/admin/products', { ...product, colors: [{ name: 'X', hex: 'red' }] }).expect(422)).body.detail, 'Colour needs a valid #RRGGBB code.');
    assert.equal((await post('/api/admin/products', { ...product, price: '12.5' }).expect(422)).body.detail, 'Price must be a whole number in LKR.');
    assert.equal((await post('/api/admin/products', { ...product, image: 'http://evil.example/x.png' }).expect(422)).body.detail, 'Image should be a local uploaded image, asset, or HTTPS URL.');
    assert.equal((await post('/api/admin/products', { ...product, image: 'uploads/../alfa.db' }).expect(422)).body.detail, 'Invalid image path.');
    assert.equal((await post('/api/admin/products', { ...product, category: 'Hats' }).expect(422)).body.detail, 'Unknown collection.');

    const campaign = (await agent.get('/api/admin/data')).body.campaigns[0];
    await post('/api/admin/campaigns', { ...campaign, link: 'javascript:alert(1)' }).expect(422);
    await post('/api/admin/campaigns', { ...campaign, id: 7 }).expect(422);
    await post('/api/admin/campaigns', { ...campaign, kicker: 'NEW KICKER' }).expect(200);

    await post('/api/admin/settings', { phone: '+94 71 091 0951' }).expect(422);
    await post('/api/admin/settings', { video_url: 'uploads/clip.mov' }).expect(422);
    await post('/api/admin/settings', { phone: '94710910951', announcement: 'NEW DROP', __seeded: '0' }).expect(200);
    const { body } = await request(ctx.app).get('/api/storefront');
    assert.equal(body.settings.announcement, 'NEW DROP');
    assert.equal(body.campaigns[0].kicker, 'NEW KICKER');
    assert.equal(ctx.repo.db.prepare(`SELECT value FROM settings WHERE key='__seeded'`).pluck().get(), '1');
  });

  test('converts uploaded images to WebP and rejects other files', async () => {
    const { agent, csrf } = await signIn(ctx.app);
    const png = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#164535' } }).png().toBuffer();
    const ok = await agent.post('/api/admin/upload').set('X-CSRF-Token', csrf).attach('file', png, 'photo.png').expect(200);
    assert.match(ok.body.path, /^uploads\/[0-9a-f]{24}\.webp$/);
    const served = await request(ctx.app).get('/' + ok.body.path).expect(200);
    assert.equal(served.headers['content-type'], 'image/webp');

    await agent.post('/api/admin/upload').set('X-CSRF-Token', csrf).attach('file', Buffer.from('<svg/>'), 'x.svg').expect(422);
    await agent.post('/api/admin/upload').set('X-CSRF-Token', csrf).attach('file', Buffer.from('not an image'), 'x.png').expect(422);
  });

  test('downloads a database backup and a CSV', async () => {
    const { agent } = await signIn(ctx.app);
    const backup = await agent.get('/api/admin/backup').buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    assert.equal((backup.body as Buffer).subarray(0, 15).toString(), 'SQLite format 3');

    const csv = await agent.get('/api/admin/catalogue.csv').expect(200);
    assert.match(csv.text, /SKU,Name,Category/);
    assert.match(csv.text, /ALFA-POLO-01,Signature Piqué Polo,Polos/);
  });

  test('logout ends the session', async () => {
    const { agent, csrf } = await signIn(ctx.app);
    await agent.post('/api/admin/logout').set('X-CSRF-Token', csrf).send({}).expect(200);
    await agent.get('/api/admin/data').expect(401);
  });

  test('locks out repeated failed sign-ins', async () => {
    const fresh = setup();
    try {
      for (let i = 0; i < 10; i++) {
        await request(fresh.app).post('/api/admin/login').send({ username: 'owner', password: 'wrong password!' }).expect(401);
      }
      await request(fresh.app).post('/api/admin/login').send({ username: 'owner', password: 'wrong password!' }).expect(429);
    } finally {
      fresh.db.close();
      fs.rmSync(fresh.dir, { recursive: true, force: true });
    }
  });
});

describe('passwords', () => {
  test('round-trips and enforces the minimum length', async () => {
    const hash = await hashPassword('a long enough password');
    assert.equal(await verifyPassword('a long enough password', hash), true);
    assert.equal(await verifyPassword('wrong', hash), false);
    await assert.rejects(ownerPasswordHash('short'));
  });

  test('accepts hashes written by the original Python kit', async () => {
    // Generated with: hashlib.scrypt(b'python-made-password', salt=bytes(range(16)), n=2**14, r=8, p=1).hex()
    const python = 'scrypt:16384:8:1:000102030405060708090a0b0c0d0e0f:'
      + 'c9c9f74f5b5a8957c87b1e4b43a24289dcf94fc90b7104070cdcb29162e795212358e6b6ff7710c124d0c1e0c36b7d113ab735b3747e5bb45807d22c70ce909e';
    assert.equal(await verifyPassword('python-made-password', python), true);
    assert.equal(await verifyPassword('python-made-passwore', python), false);
  });
});
