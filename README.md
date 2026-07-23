# Mini Militia League & Analytics Platform

Production-ready MERN league management and analytics platform for verified Mini Militia match screenshots.

## Core workflow

```text
Screenshot Upload
        ↓
Cloudinary Storage
        ↓
Google Vision OCR
        ↓
Moderator Correction and Player Matching
        ↓
Verified Match
        ↓
Statistics, Leaderboards, MVP, Ratings and Awards
```

Only verified matches affect official calculations.

## Technology

### Frontend

- React 19 and Vite
- React Router
- Tailwind CSS
- TanStack Query
- Axios
- React Hook Form and Zod
- Recharts
- Better Auth client

### Backend

- Node.js and Express
- MongoDB Atlas and Mongoose
- Better Auth
- Cloudinary
- Google Vision OCR
- Zod, Helmet, CORS and rate limiting
- Optional OpenAI insights with deterministic fallback

## Main features

- Email/password authentication and secure sessions
- Admin, Moderator and Player RBAC
- Atomic `MM001` player IDs and player management
- Player and match image uploads
- Real-layout Mini Militia OCR parser
- Manual OCR correction and match verification
- Verified match history, gallery and revision workflow
- Core statistics and performance graphs
- Weekly, monthly, season and all-time leaderboards
- Configurable MVP and rating formulas
- Dynamic titles and achievements
- Rivalries and challenges
- Hall of Fame and season lifecycle
- Player cards and social sharing images
- Notification center
- AI summaries and deterministic fallback
- Audit logs, historical snapshots and reproducible calculations

## Local setup

```bash
npm ci
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run admin:bootstrap
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend health:

```text
http://localhost:5000/api/v1/health
```

## Quality checks

```bash
npm run qa
npm run deployment:validate
npm run test:coverage
npm audit --omit=dev
```

Phase 13 result:

```text
251 automated tests passed
Server critical coverage: 70.08% statements
Client critical coverage: 98.75% statements
```

## Production database preparation

Create `server/.env` from `server/.env.production.example`, then run:

```bash
npm run deploy:preflight
npm run db:prepare
npm run admin:bootstrap
```

`db:prepare` applies all versioned index migrations and seeds default formulas, titles, achievements and challenges.

## Deployment

Recommended topology:

```text
Frontend: Vercel
Backend: Render or Railway
Database: MongoDB Atlas
Images: Cloudinary
OCR: Google Vision
```

Deployment files:

```text
vercel.json
render.yaml
railway.toml
server/.env.production.example
client/.env.production.example
```

Complete deployment guide:

- [`PHASE_14_DEPLOYMENT_AND_DOCUMENTATION.md`](./PHASE_14_DEPLOYMENT_AND_DOCUMENTATION.md)
- [`docs/deployment/DEPLOYMENT_GUIDE.md`](./docs/deployment/DEPLOYMENT_GUIDE.md)
- [`docs/deployment/PRODUCTION_ENVIRONMENT.md`](./docs/deployment/PRODUCTION_ENVIRONMENT.md)
- [`docs/deployment/OPERATIONS_RUNBOOK.md`](./docs/deployment/OPERATIONS_RUNBOOK.md)
- [`docs/deployment/BACKUP_AND_RECOVERY.md`](./docs/deployment/BACKUP_AND_RECOVERY.md)
- [`docs/deployment/TROUBLESHOOTING.md`](./docs/deployment/TROUBLESHOOTING.md)
- [`docs/deployment/PRODUCTION_RELEASE_CHECKLIST.md`](./docs/deployment/PRODUCTION_RELEASE_CHECKLIST.md)
- [`docs/deployment/FINAL_PROJECT_REVIEW.md`](./docs/deployment/FINAL_PROJECT_REVIEW.md)

## API documentation

- [`docs/openapi.yaml`](./docs/openapi.yaml)
- [`docs/deployment/API_DOCUMENTATION.md`](./docs/deployment/API_DOCUMENTATION.md)

Better Auth routes use `/api/auth/*`. Application routes use `/api/v1/*`.

## Production smoke test

```bash
PUBLIC_API_URL=https://your-api.example.com \
PUBLIC_APP_URL=https://your-app.example.com \
npm run verify:production
```

## Backup and recovery

```bash
./scripts/backup/atlas-backup.sh
./scripts/backup/atlas-restore.sh
```

The restore script requires explicit destructive confirmation and should first target a non-production database or cluster.

## Important production rules

- Use MongoDB Atlas or another replica set; transactions are required.
- Never commit `.env` files or credentials.
- Never place secrets in `VITE_` variables.
- Use exact HTTPS origins for credentialed CORS.
- Preserve original screenshots and raw OCR responses.
- Never hard-delete historical players or silently rewrite awards.
