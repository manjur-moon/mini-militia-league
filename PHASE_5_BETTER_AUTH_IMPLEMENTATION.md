# Phase 5: Better Auth Implementation

## Included

- Better Auth 1.6.23 server and React client
- Official MongoDB adapter
- Email/password registration and login
- Database-backed cookie sessions
- Logout and reactive session state
- Protected Express middleware
- Protected React route
- Inactive-account blocking
- Server-owned `role`, `status`, and `linkedPlayerId` fields
- Strict trusted origins and credentialed CORS
- Production cookie configuration
- Authentication rate limits
- Authentication tests

## Main server files

```text
server/src/config/auth.js
server/src/config/auth-database.js
server/src/middleware/auth.middleware.js
server/src/controllers/auth.controller.js
server/src/routes/auth.routes.js
server/src/app.js
```

Better Auth owns these native routes:

```text
POST /api/auth/sign-up/email
POST /api/auth/sign-in/email
POST /api/auth/sign-out
GET  /api/auth/get-session
GET  /api/auth/ok
```

Application-owned protected endpoint:

```text
GET /api/v1/auth/me
```

## Main client files

```text
client/src/lib/auth-client.js
client/src/features/auth/components/protected-route.jsx
client/src/features/auth/components/public-only-route.jsx
client/src/pages/login.page.jsx
client/src/pages/register.page.jsx
client/src/pages/account.page.jsx
```

## Environment setup

Copy the examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Generate the Better Auth secret:

```bash
openssl rand -base64 48
```

Development values:

```env
BETTER_AUTH_URL=http://localhost:5000
CLIENT_ORIGINS=http://localhost:5173
AUTH_COOKIE_SAME_SITE=lax
VITE_AUTH_BASE_URL=http://localhost:5000
```

For separate production domains such as Vercel and Render:

```env
NODE_ENV=production
BETTER_AUTH_URL=https://your-api.example.com
CLIENT_ORIGINS=https://your-frontend.example.com
AUTH_COOKIE_SAME_SITE=none
TRUST_PROXY=true
VITE_AUTH_BASE_URL=https://your-api.example.com
```

`SameSite=None` requires HTTPS and secure cookies.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173/register
http://localhost:5173/login
http://localhost:5173/account
```

## Test

```bash
npm run lint
npm run test
npm run build
```

## Security decisions

- No custom JWT authentication system exists.
- Better Auth receives requests before `express.json()`.
- Public signup cannot set role, status, or linked player ID.
- Protected backend routes validate the Better Auth session again.
- Inactive users cannot sign in or use protected application routes.
- Session tokens are never returned by `/api/v1/auth/me`.
- CSRF and origin checks remain enabled.
- Cookies are HTTP-only and become secure in production.

## Deferred to Phase 6

- Admin, moderator, and player authorization rules
- User-role management endpoints
- User-to-player linking workflow
- Initial admin creation
- Last-admin protection
