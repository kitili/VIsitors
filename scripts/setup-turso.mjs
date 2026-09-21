console.log(`
Turso setup for Vercel (free, persistent database)
==================================================

1. Create a free account at https://turso.tech
2. Install the CLI:  curl -sSfL https://get.tur.so/install.sh | bash
3. Login:            turso auth login
4. Create database:  turso db create silverleaf-visitors
5. Get URL:          turso db show silverleaf-visitors --url
6. Create token:     turso db tokens create silverleaf-visitors

7. In Vercel → Project → Settings → Environment Variables, add:
   TURSO_DATABASE_URL   = libsql://....turso.io
   TURSO_AUTH_TOKEN     = eyJ...
   NEXT_PUBLIC_APP_URL  = https://your-production-domain.vercel.app

8. Redeploy the project.

Also disable Deployment Protection for production:
   Vercel → Project → Settings → Deployment Protection → Off (for Production)

Without Turso, the app uses temporary storage on Vercel and forms may fail.
`);
