# Deployment Troubleshooting

## Backend deploy fails during environment validation

Check that every required variable exists and contains no placeholder. Run locally:

```bash
npm run deploy:preflight
```

## Backend health check fails

- Confirm start command is `npm run start -w server`.
- Confirm the platform provides `PORT`.
- Confirm health path is `/api/v1/health`.
- Check Atlas IP access, database user and password encoding.
- Check that the selected Node version satisfies `>=22.13.0`.

## Login works locally but not in production

- Use HTTPS for both origins.
- Set `AUTH_COOKIE_SAME_SITE=none`.
- Set `TRUST_PROXY=true`.
- Set `BETTER_AUTH_URL` to the backend origin, without `/api/auth`.
- Set `VITE_AUTH_BASE_URL` to the backend origin.
- Add the exact Vercel origin to `CLIENT_ORIGINS`.
- Do not include a trailing path in origin variables.
- Use a stable production domain rather than changing preview domains.

## CORS error

`CLIENT_ORIGINS` is an exact comma-separated allowlist. Scheme, host and port must match the browser origin exactly.

## Vercel direct-route 404

Confirm Vercel Root Directory is the repository root and `vercel.json` is included. The file rewrites all SPA routes to `/index.html`.

## Atlas connection timeout

- Add the backend outbound IP/CIDR to Atlas Network Access.
- Confirm outbound TCP access to MongoDB.
- Confirm the SRV hostname and database user.
- URL-encode password characters.
- Do not use the Atlas UI account password as the database-user password.

## Cloudinary upload fails

- Supply all three Cloudinary variables together.
- Confirm API Secret is backend-only.
- Check account quotas and upload restrictions.
- Confirm uploaded image size and signature are supported.

## OCR fails

- Enable Cloud Vision API and billing.
- Restrict the API key to Vision API.
- Set `OCR_PROVIDER=google-vision`.
- Confirm screenshot crop variables match the supplied Mini Militia layout.
- Review the persisted OCR job error before retrying.

## Transactions fail

Use MongoDB Atlas or another replica set. Standalone local MongoDB does not support the transaction workflow used for match verification, revisions and formula activation.
