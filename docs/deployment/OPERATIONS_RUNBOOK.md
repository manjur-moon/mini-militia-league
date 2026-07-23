# Operations Runbook

## Routine deploy

```bash
git pull
npm ci
npm run qa
npm run deploy:preflight
git push
```

After platform deployment:

```bash
PUBLIC_API_URL=https://api.example.com \
PUBLIC_APP_URL=https://app.example.com \
npm run verify:production
```

## Schema or index change

Before deploy:

```bash
npm run db:migrate
```

Default definitions can be safely re-seeded:

```bash
npm run seed:defaults
```

## Admin bootstrap

```bash
npm run admin:bootstrap
```

Run only from a trusted machine. Remove bootstrap password variables immediately afterward.

## Health and logs

Health endpoint:

```text
GET /api/v1/health
```

Investigate these log groups first:

- Database connection or server-selection failures
- Invalid environment configuration
- CORS origin denial
- Better Auth session/cookie failures
- OCR provider errors and retry exhaustion
- Cloudinary upload errors
- Transaction failures during verification or recalculation
- AI provider timeout or validation fallback

Always correlate errors using `requestId`. Production responses do not expose stack traces.

## Rollback

1. Stop new moderator verification if the release affects official data.
2. Roll back the backend deployment in Render/Railway.
3. Roll back the frontend deployment in Vercel.
4. Do not restore the database unless data was corrupted.
5. If a database restore is necessary, restore into a separate Atlas cluster/database first.
6. Run smoke tests before switching production traffic.

## Incident priorities

### Authentication outage

- Check `BETTER_AUTH_URL`, `CLIENT_ORIGINS`, HTTPS and cookie attributes.
- Inspect browser cookies and CORS response headers.
- Confirm Atlas connectivity and Better Auth collections.

### OCR outage

- Keep uploaded screenshots and OCR jobs preserved.
- Set `OCR_PROVIDER=disabled` only when intentionally pausing OCR.
- Never mark failed jobs as completed.
- Retry from the moderator dashboard after provider recovery.

### Statistics inconsistency

- Stop match verification.
- Identify the affected match and audit trail.
- Use controlled verified-match revision.
- Run the relevant recalculation endpoints or admin UI.
- Verify source-data hashes and snapshots before reopening verification.
