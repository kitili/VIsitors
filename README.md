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
# VIsitors
