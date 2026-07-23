# Security Review Checklist

## Automated checks completed

- [x] Helmet headers enabled.
- [x] `X-Powered-By` disabled.
- [x] Strict CORS allow-list tested.
- [x] API rate limiter mounted.
- [x] Better Auth handler mounted before JSON parsing.
- [x] Protected API rejects missing sessions.
- [x] Backend RBAC tested independently of frontend guards.
- [x] Zod strict schemas reject unknown fields.
- [x] Operator-like query keys are rejected.
- [x] Malformed JSON returns sanitized HTTP 400.
- [x] Production stack traces are not returned.
- [x] Upload signature and size validation tested.
- [x] Client source contains no server-secret identifiers.
- [x] AI output schema rejects URLs, emails and unknown players where prohibited.

## Before production

- [ ] Use a new Better Auth secret with at least 32 bytes of entropy.
- [ ] Restrict Atlas network access and create a least-privilege database user.
- [ ] Restrict Cloudinary upload presets/folders and rotate staging credentials.
- [ ] Restrict Google Vision API key by API and server origin/IP where supported.
- [ ] Keep OpenAI key server-only; never use a `VITE_` prefix.
- [ ] Set exact production frontend and backend origins.
- [ ] Confirm secure cookies, HTTPS and trusted proxy configuration.
- [ ] Confirm Render/Railway logs do not contain tokens, cookies or raw secrets.
- [ ] Run `npm audit --omit=dev` before release.
- [ ] Review admin accounts and remove temporary staging users.
