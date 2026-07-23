# Production Release Checklist

## Infrastructure

- [ ] MongoDB Atlas cluster is active and reachable from the backend platform.
- [ ] A least-privilege database user is configured.
- [ ] Atlas Network Access contains only approved IP addresses or CIDR ranges.
- [ ] Cloudinary credentials are configured on the backend only.
- [ ] Cloud Vision API is enabled and the API key is restricted.
- [ ] Vercel, Render/Railway and Atlas regions are selected intentionally.

## Configuration

- [ ] `NODE_ENV=production`.
- [ ] All public URLs use HTTPS.
- [ ] `CLIENT_ORIGINS` exactly matches the deployed frontend origin.
- [ ] `BETTER_AUTH_URL` exactly matches the backend origin.
- [ ] `AUTH_COOKIE_SAME_SITE=none` for separate frontend/backend origins.
- [ ] `TRUST_PROXY=true`.
- [ ] No placeholder or example secret remains.
- [ ] No secret uses a `VITE_` prefix.

## Database

- [ ] `npm run deploy:preflight` passes.
- [ ] `npm run db:prepare` completes successfully.
- [ ] `npm run admin:bootstrap` creates or confirms the initial admin.
- [ ] Temporary bootstrap credentials are removed after use.
- [ ] A current backup or Atlas snapshot exists before migration.

## Application smoke tests

- [ ] Backend health endpoint returns HTTP 200.
- [ ] Frontend root and direct deep links return the SPA.
- [ ] Registration, login, refresh and logout work.
- [ ] Admin, Moderator and Player route restrictions work.
- [ ] Player creation generates a unique `MM###` ID.
- [ ] Player photo upload succeeds.
- [ ] Real screenshot upload succeeds.
- [ ] OCR enters a persisted review state.
- [ ] Moderator correction and player matching work.
- [ ] Verification updates official statistics.
- [ ] Leaderboard and MVP data refresh.
- [ ] Notification delivery works.
- [ ] Public profile, player card and social images render.

## Security and operations

- [ ] `npm run qa` passes on the release commit.
- [ ] `npm audit --omit=dev` reports no high-severity production issue.
- [ ] Production logs contain no secret values.
- [ ] Error responses contain request IDs but no stack traces.
- [ ] Backup restore has been rehearsed against a non-production target.
- [ ] Rollback steps and responsible operator are documented.
