# Silverleaf Visitor Log

Next.js visitor sign-in for Silverleaf Academy campuses: **Usa River**, **Arusha Modern**, **Kijenge**, **Ilboru**, and **Boma**.

No passwords — pick a campus dashboard from the home page.

## Run locally (with public QR — works on any network)

```bash
npm install
npm run dev:public
```

This starts the app, opens a **public internet link** for the QR code, and seeds sample visitors. Scan the QR from `/qr` on mobile data — no same Wi‑Fi needed.

Or run separately:

```bash
npm run dev      # terminal 1
npm run tunnel   # terminal 2 — writes data/public-url.json
npm run seed     # add sample visitors
```

The QR code and the link shown under it both point to `/check-in` on the public URL.

## Campus dashboards

| Campus | Front desk |
| --- | --- |
| Usa River | `/campus/usa-river` |
| Arusha Modern | `/campus/arusha-modern` |
| Kijenge | `/campus/kijenge` |
| Ilboru | `/campus/ilboru` |
| Boma | `/campus/boma` |

Each campus also has **History** and **QR poster** tabs.

## Smoke test

```bash
npm run smoke
```

## Deploy on Vercel

The app is deployed at your Vercel URL. For production you need:

### 1. Disable deployment protection (fixes login wall on QR scan)

In Vercel → **Project → Settings → Deployment Protection** → turn **off** for Production.  
Otherwise visitors scanning the QR hit a Vercel login page instead of the check-in form.

### 2. Add a Turso database (fixes form submit / saves visitors)

Vercel serverless cannot use a local SQLite file permanently. Use free [Turso](https://turso.tech):

```bash
node scripts/setup-turso.mjs   # prints step-by-step instructions
```

Add these **Environment Variables** in Vercel:

| Variable | Example |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://silverleaf-visitors-xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | token from `turso db tokens create` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

Redeploy after adding env vars.

### 3. QR codes on Vercel

QR codes automatically use your Vercel URL — no cloudflare tunnel needed in production.  
Open `/qr` on the deployed site and print that poster.
