# ALFA by Alfa Infinity — storefront + owner CMS

A premium clothing storefront with a password-protected content management system (CMS), built with **React** (frontend) and **Node.js / Express / SQLite** (backend). Customers browse the collection, build a bag and send their order or bulk-quote request to ALFA on **WhatsApp**. The owner manages products, prices, stock, hero campaigns, collection banners, store details, uploads and backups from `/admin`.

The look is carried over unchanged from the original HTML/Python kit it was rebuilt from.

```
alfa-inf/
├── frontend/                 React 19 + Vite + TypeScript
│   ├── index.html            storefront page (server embeds live catalogue data here)
│   ├── admin.html            owner control room page (sign-in + dashboard)
│   ├── public/assets/        concept images, logo, emblem (served at /assets)
│   └── src/
│       ├── store/            storefront: StoreApp, components/, data.ts, hooks.ts, store.css
│       ├── admin/            LoginPage, Dashboard, api.ts, login.css, dashboard.css
│       └── shared/           types and helpers used by both
├── backend/                  Node 22+ / Express 5 / better-sqlite3 / sharp
│   ├── src/
│   │   ├── server.ts         starts the web server
│   │   ├── app.ts            security headers, routes, error handling
│   │   ├── routes/admin.ts   sign-in, CMS API, uploads, backups
│   │   ├── routes/site.ts    serves the built React site
│   │   ├── db.ts             SQLite schema, seed data, queries
│   │   ├── validation.ts     input rules for products, campaigns, banners, settings
│   │   ├── auth.ts           scrypt passwords, sessions, CSRF
│   │   ├── media.ts          image → WebP conversion, MP4 checks
│   │   └── cli.ts            set the owner password
│   ├── test/api.test.ts      API tests (node:test + supertest)
│   ├── data/                 SQLite database (runtime, git-ignored)
│   └── uploads/              owner uploads (runtime, git-ignored)
├── Dockerfile                single-container production image
├── DEPLOYMENT.md             how to put it online
└── LAUNCH_CHECKLIST.md       content and business items to finish before selling
```

## Quick start (development)

Requires **Node.js 22.12 or newer** (24 recommended; see `.nvmrc`).

```bash
npm install
```

```bash
npm run set-password
```

```bash
npm run dev
```

- Storefront: **http://localhost:5173**
- Owner sign-in / CMS: **http://localhost:5173/admin** (username `owner`, the password you just chose; at least 12 characters, there is no default)

`npm run dev` runs the API on port 8000 and the Vite dev server on 5173 (with hot reload), which forwards `/api` and `/uploads` to the API.

## Production build

```bash
npm run build
```

```bash
npm start
```

One Node process then serves everything on **http://127.0.0.1:8000**: the storefront, `/admin`, the API and uploads. Restart it after every new build. See [DEPLOYMENT.md](DEPLOYMENT.md) for HTTPS, a domain, systemd, Docker and backups.

## Scripts (run from the repo root)

| Command | What it does |
| --- | --- |
| `npm run dev` | API + React dev server with hot reload |
| `npm run build` | Typecheck and build the frontend, compile the backend |
| `npm start` | Run the production server (after `build`) |
| `npm test` | Backend API tests |
| `npm run typecheck` | TypeScript checks for both packages |
| `npm run set-password` | Create or change the owner password (signs out every session) |

On a server without dev tools, use `node backend/dist/cli.js set-password`. Setting `ALFA_OWNER_PASSWORD` makes it non-interactive.

## Configuration

Copy `backend/.env.example` to `backend/.env` (all optional):

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` / `HOST` | `8000` / `127.0.0.1` | Where the server listens |
| `ALFA_DATA_DIR` | `backend/data` | SQLite database folder (needs persistent disk) |
| `ALFA_UPLOAD_DIR` | `backend/uploads` | Owner uploads (needs persistent disk) |
| `ALFA_FRONTEND_DIST` | `frontend/dist` | Built React site |
| `TRUST_PROXY` | `loopback` | Which reverse proxies may set client IP / HTTPS headers |

## How the owner updates the shop

1. Sign in at `/admin`.
2. **Media & backup**: upload a photo (JPG/PNG/WebP up to 9 MB, converted to WebP automatically) or an MP4 (up to 40 MB) and copy the returned path, e.g. `uploads/a1b2c3….webp`.
3. **Products**: pick a product or **+ New product**, then fill in the name, descriptions, sizes, colours (`Forest:#164535, Stone:#dbd2b7`), LKR price (blank = "Price on enquiry"), stock (0 = "Currently unavailable"), image path, and the published/featured switches. The editor previews the image path as you type.
4. **Hero campaigns** / **Collection banners**: edit the three hero slides and the three cards. In headlines, `|` starts a new line and `*word*` turns it green.
5. **Store settings**: WhatsApp number, displayed number, announcement bar, order note, Instagram link (appears in the footer) and workshop video.

Changes show up on the storefront at the next page load.

## What changed from the original HTML kit

The pages look the same: the CSS was moved over verbatim, and the markup was rebuilt as React components with the same structure and class names. Behind the scenes:

- **Faster, flash-free first paint.** The server embeds the current catalogue in the storefront HTML, so products and campaigns no longer pop in after a second request.
- **Bag persists** across refreshes, in the customer's browser.
- **Footer.** The public "Manage demo catalogue" link (which pointed at a missing `admin.html`) is gone; the owner goes to `/admin` directly. The footer shows Instagram once it is set in the CMS (that setting was previously ignored).
- **Hero buttons** keep their arrow spacing after CMS content loads (it used to collapse), and an empty second button is hidden.
- **Admin.** Live image previews in the editors, keyboard-operable campaign/banner cards, a busy state while saving, and dated backup and CSV file names (the CSV now opens correctly in Excel).
- **Security.** Content-Security-Policy and the other security headers, failed sign-in rate limiting, httpOnly + SameSite session cookies (Secure over HTTPS), CSRF tokens on every change, server-side validation of all input, uploads re-encoded (which strips metadata), WAL-mode SQLite with consistent online backups.
- **Accessibility.** Dialogs are inert while closed, and buttons report pressed state.
- **Engineering.** TypeScript throughout, an automated API test suite, a production build, Docker support and a graceful shutdown.

### Moving data from the Python kit

The database schema and password-hash format are unchanged. To keep content and the owner password from an earlier install, copy its `data/alfa.db` to `backend/data/alfa.db`, and its `uploads/` folder to `backend/uploads/`, before starting the server. (The `alfa.db` shipped in the kit holds only the default seed content and no owner account, so a fresh start is equivalent.)

## Not included yet

Online card payments, order management, per-size/colour stock, email notifications and a real 3D garment model. A WhatsApp order is an **enquiry**, not a paid order. Product images are concept renders until real photography is uploaded. See [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md).
