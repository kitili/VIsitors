console.log(`
Turso setup for Vercel (persistent SQL database)
=================================================

PRODUCTION URL: https://v-isitors.vercel.app

FASTEST PATH
------------
1. Accept terms (one-time):
   https://vercel.com/mourinekitilimourine-8096s-projects/~/integrations/accept-terms/tursocloud

2. Run:
   npm run provision:turso

   This provisions Turso, injects env vars, redeploys, and verifies persistence.

3. Confirm:
   npm run handover:production


MANUAL CLI
----------
vercel integration add tursocloud/database \\
  -n silverleaf-visitors \\
  -m region=iad1 \\
  --plan starter \\
  -e production

vercel --prod
npm run handover:production


MANUAL (turso.tech)
-------------------
1. Create account at https://turso.tech
2. Install CLI:  curl -sSfL https://get.tur.so/install.sh | bash
3. Login:        turso auth login
4. Create DB:    turso db create silverleaf-visitors
5. Get URL:      turso db show silverleaf-visitors --url
6. Create token: turso db tokens create silverleaf-visitors

7. Add in Vercel → v-isitors → Settings → Environment Variables:
   TURSO_DATABASE_URL   = libsql://....turso.io
   TURSO_AUTH_TOKEN     = eyJ...
   NEXT_PUBLIC_APP_URL  = https://v-isitors.vercel.app

8. Redeploy and run: npm run handover:production
`);
