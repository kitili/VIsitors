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

## Database (SQL / SQLite)

The app uses **SQL** via SQLite:

| Environment | Storage |
| --- | --- |
| **Local dev** | `data/visits.db` (SQLite file, created automatically) |
| **Vercel production** | [Turso](https://turso.tech) remote SQLite (free, persistent) |

Initialize or verify the local database:

```bash
npm run init-db
```

Check database health: `GET /api/health`

## Deploy on Vercel

### 1. Disable deployment protection (fixes login wall on QR scan)

Vercel → **Project → Settings → Deployment Protection** → turn **off** for Production.

### 2. Add Turso for persistent SQL on Vercel

```bash
npm run setup:turso   # step-by-step instructions
```

Add in Vercel → **Settings → Environment Variables**:

| Variable | Example |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://silverleaf-visitors-xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | from `turso db tokens create` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

Redeploy. Without Turso, forms may work briefly but **data is not saved** between requests.

### 3. QR codes on Vercel

QR codes use your Vercel URL automatically. Open `/qr` on the live site and print that poster.
