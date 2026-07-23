# Phase 14: Deployment and Documentation

## Production topology

```text
Vercel (React/Vite SPA)
        |
        | HTTPS + credentialed CORS
        v
Render or Railway (Node/Express/Better Auth)
        |             |                 |
        v             v                 v
MongoDB Atlas     Cloudinary       Google Vision OCR
                                      |
                                      v
                              OpenAI (optional)
```

## Release order

1. Create the MongoDB Atlas database user and network access rules.
2. Configure Cloudinary and Google Vision.
3. Deploy the backend to Render or Railway.
4. Set the final backend URL in backend environment variables.
5. Run database migrations, default seeding and initial-admin bootstrap locally against Atlas.
6. Deploy the frontend to Vercel with the final backend URLs.
7. Update `CLIENT_ORIGINS` and `PUBLIC_APP_URL` on the backend with the final Vercel URL.
8. Redeploy the backend.
9. Run production verification and the manual release gate.

## Required commands

```bash
npm ci
npm run qa
npm run deployment:validate
```

Prepare MongoDB Atlas before the first production login:

```bash
cp server/.env.production.example server/.env
npm run deploy:preflight
npm run db:prepare
npm run admin:bootstrap
```

After deployment:

```bash
PUBLIC_API_URL=https://your-api.example.com \
PUBLIC_APP_URL=https://your-app.example.com \
npm run verify:production
```

## Build and start commands

### Backend

```text
Build: npm ci --omit=dev
Start: npm run start -w server
Health check: /api/v1/health
```

### Frontend

```text
Root directory: repository root
Build: npm run build
Output directory: client/dist
```

`vercel.json` provides the SPA deep-link rewrite and production response headers.

## Production security decisions

- Better Auth remains the only authentication system.
- Cross-origin frontend/backend deployment uses HTTPS cookies with `SameSite=None` and `Secure`.
- `CLIENT_ORIGINS` is an exact allowlist, never `*`.
- `TRUST_PROXY=true` is required behind Render or Railway.
- Cloudinary, Vision and OpenAI secrets remain backend-only.
- Database indexes are synchronized explicitly; production Mongoose auto-indexing stays disabled.
- The first admin is created through the idempotent bootstrap script.
- Default formulas, titles, achievements and challenges are seeded idempotently.
- MongoDB Atlas or another replica-set deployment is mandatory for transactions.

## Included production files

```text
render.yaml
railway.toml
vercel.json
server/.env.production.example
client/.env.production.example
server/src/scripts/production-preflight.js
server/src/scripts/seed-production-defaults.js
scripts/deployment/verify-production.mjs
scripts/backup/atlas-backup.sh
scripts/backup/atlas-restore.sh
docs/deployment/DEPLOYMENT_GUIDE.md
docs/deployment/PRODUCTION_ENVIRONMENT.md
docs/deployment/OPERATIONS_RUNBOOK.md
docs/deployment/BACKUP_AND_RECOVERY.md
docs/deployment/API_DOCUMENTATION.md
docs/deployment/PRODUCTION_RELEASE_CHECKLIST.md
docs/deployment/FINAL_PROJECT_REVIEW.md
```

## Final release gate

The release is approved only after:

- `/api/v1/health` returns HTTP 200.
- A Vercel deep link loads directly without a 404.
- Registration, login, logout and session restoration work in production.
- Admin, Moderator and Player permissions are confirmed.
- A real screenshot completes upload, OCR, correction and verification.
- The verified match updates player statistics and weekly leaderboards.
- Cloudinary assets render over HTTPS.
- Database backup and restore procedures have been tested against a non-production database.
- No production secret is committed to Git.
