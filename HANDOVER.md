# Silverleaf Visitor Log — Handover Checklist

## Production URL

**https://v-isitors.vercel.app**

## System overview

| Item | Detail |
| --- | --- |
| **App** | Next.js 15 visitor sign-in for 5 Silverleaf campuses |
| **Database** | SQL / SQLite (Turso on Vercel for persistence) |
| **GitHub** | https://github.com/kitili/VIsitors |
| **Local dev** | `npm run dev` on port 3108 |

## Handover checklist

| Step | Status | Action |
| --- | --- | --- |
| Production site live | ✅ | https://v-isitors.vercel.app |
| QR points to production URL | ✅ | `/qr` → check-in on Vercel |
| Sign-in form works on production | ✅ | Verified via handover test |
| `NEXT_PUBLIC_APP_URL` set on Vercel | ✅ | Already configured |
| Turso persistent database | ⬜ | **Do this now** — see below |
| Print QR from live site | ⬜ | Open `/qr`, print poster |
| Staff briefed | ⬜ | Share `STAFF-GUIDE.md` |
| Production handover test | ⬜ | Run `npm run handover:production` |

## Finish Turso (5 minutes — one-time)

This makes visitor data **persist** on Vercel (without it, data resets between server restarts).

### Option A — Vercel Marketplace (easiest)

1. Open: https://vercel.com/mourinekitilimourine-8096s-projects/~/integrations/accept-terms/tursocloud
2. Accept Turso terms
3. In terminal:
   ```bash
   cd /home/kiki/Downloads/silverleaf-visitor-log
   vercel integration add turso
   ```
4. Follow prompts to link database to **v-isitors** project
5. Redeploy: `vercel --prod`

### Option B — Manual Turso

```bash
npm run setup:turso
```

Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel → Settings → Environment Variables, then redeploy.

## Verify handover

```bash
npm run handover:production
npm run smoke          # local
```

## Key routes

| Route | Who uses it |
| --- | --- |
| `/` | Staff — pick a campus |
| `/campus/{slug}` | Front desk |
| `/campus/{slug}/history` | Admin — history + CSV export |
| `/campus/{slug}/qr` | Campus QR poster |
| `/qr` | One QR for all campuses |
| `/check-in` | Visitor self sign-in |
| `/check-out` | Visitor self check-out |
| `/overview` | Leadership dashboard |

## Daily operations

1. Open front desk for your campus
2. Sign visitors in (desk or QR)
3. Sign out when they leave
4. End of day → **Sign out all today**
5. Reports → History tab → Export CSV

See **STAFF-GUIDE.md** for printable staff instructions.
