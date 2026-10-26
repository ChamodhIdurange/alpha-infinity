# Putting ALFA online

ALFA is one Node.js process that needs **HTTPS**, a **domain or subdomain** the owner controls, and a **persistent disk** for two folders:

- `ALFA_DATA_DIR`: the SQLite database (products, prices, campaigns, settings, owner login)
- `ALFA_UPLOAD_DIR`: uploaded photos and videos

A static-only host (GitHub Pages, Netlify static, S3) **cannot** run the CMS. Hosts that wipe the disk on every deploy will lose edits unless you attach a persistent volume.

## Option A: a small Linux VPS (Ubuntu 24.04) with Caddy

1. Point the domain's A/AAAA records at the server's IP.
2. Install Node.js 24 LTS (e.g. from NodeSource or `nvm`) and [Caddy](https://caddyserver.com/docs/install).
3. Create an unprivileged user and the data folders:
   ```bash
   sudo useradd --system --create-home --shell /usr/sbin/nologin alfa
   sudo mkdir -p /opt/alfa /var/lib/alfa/data /var/lib/alfa/uploads
   sudo chown -R alfa:alfa /opt/alfa /var/lib/alfa
   ```
4. Copy the project to `/opt/alfa` (git clone or rsync, without `node_modules`), then build it as that user:
   ```bash
   cd /opt/alfa && sudo -u alfa npm ci && sudo -u alfa npm run build
   ```
5. Set the owner password once (12+ characters, unique):
   ```bash
   sudo -u alfa env ALFA_DATA_DIR=/var/lib/alfa/data node backend/dist/cli.js set-password
   ```
6. Create `/etc/systemd/system/alfa.service`:
   ```ini
   [Unit]
   Description=ALFA store
   After=network.target

   [Service]
   User=alfa
   WorkingDirectory=/opt/alfa
   Environment=NODE_ENV=production
   Environment=HOST=127.0.0.1
   Environment=PORT=8000
   Environment=ALFA_DATA_DIR=/var/lib/alfa/data
   Environment=ALFA_UPLOAD_DIR=/var/lib/alfa/uploads
   Environment=TRUST_PROXY=loopback
   ExecStart=/usr/bin/node backend/dist/server.js
   Restart=on-failure
   NoNewPrivileges=true
   ProtectSystem=strict
   ReadWritePaths=/var/lib/alfa

   [Install]
   WantedBy=multi-user.target
   ```
   Then run `sudo systemctl daemon-reload && sudo systemctl enable --now alfa`.
7. `/etc/caddy/Caddyfile` (Caddy obtains and renews the HTTPS certificate automatically):
   ```caddy
   your-domain.example {
       encode zstd gzip
       reverse_proxy 127.0.0.1:8000
   }
   ```
   Then run `sudo systemctl reload caddy`.
8. Open `https://your-domain.example` and `/admin` on a phone and a computer. Sign in, upload a photo, save a product, and send a test WhatsApp enquiry.

**Updating:** pull the new code, run `npm ci && npm run build`, then `sudo systemctl restart alfa`.

## Option B: Docker

The `Dockerfile` builds one image. Keep `/data` on a volume:

```bash
docker build -t alfa-store .
```

```bash
docker run -d --name alfa --restart unless-stopped -p 127.0.0.1:8000:8000 -v alfa-data:/data alfa-store
```

```bash
docker exec -it alfa node backend/dist/cli.js set-password
```

Put Caddy or Nginx in front for HTTPS, as in Option A. The image sets `TRUST_PROXY=1`, which assumes exactly one proxy in front. Don't publish port 8000 straight to the internet with that setting, or clients could fake their IP and get around the sign-in rate limit.

## Option C: a managed app host (Render, Railway, Fly.io…)

- Build command: `npm ci && npm run build`. Start command: `npm start`.
- Set `HOST=0.0.0.0`, set `PORT` to whatever the platform gives you (often automatic), and set `TRUST_PROXY=1`.
- **Attach a persistent volume** and point `ALFA_DATA_DIR` and `ALFA_UPLOAD_DIR` at folders on it, or every redeploy resets the shop.
- Run `node backend/dist/cli.js set-password` once from the platform's shell.

## Backups

Back up the database and the uploads **together**: the database refers to uploaded files by name.

- From the CMS: **Media & backup → Download database backup** (a consistent snapshot, even while the shop is live), plus a copy of the uploads folder.
- On a server: copy the uploads folder, and take a database snapshot with `sqlite3 /var/lib/alfa/data/alfa.db ".backup '/backups/alfa-$(date +%F).db'"`, daily and off the server.
- To restore, stop the service, put `alfa.db` and the uploads back in place, and start the service. Practise this once before launch.

## Security notes

- Always serve the site over HTTPS. The session cookie is only marked `Secure` when the request arrived over HTTPS, so the proxy must send `X-Forwarded-Proto` (Caddy and Nginx do), and `TRUST_PROXY` must match your setup.
- Keep the Node process bound to `127.0.0.1` behind the proxy.
- Keep the OS and dependencies updated (`npm audit`, unattended-upgrades).
- No card data is ever handled here. Before adding online payments, choose a Sri Lanka-compatible payment provider and implement its hosted checkout, webhooks and refunds server-side.
