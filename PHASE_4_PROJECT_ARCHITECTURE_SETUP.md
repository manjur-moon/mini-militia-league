# Phase 4: Project Architecture and Setup

## Included

- npm workspace monorepo
- Separate `client`, `server` and `shared` packages
- Existing Phase 2 Mongoose models
- Existing Phase 3 API constants and OpenAPI documentation
- Express 5 application foundation
- MongoDB connection lifecycle
- Zod environment validation
- Strict CORS allowlist
- Helmet, compression and rate limiting
- Request IDs and structured logs
- Central error handling
- Reusable request validation middleware
- Standard API success/error responses
- Health-check API
- React + Vite application
- React Router data router
- Tailwind CSS Vite integration
- TanStack Query provider
- Axios client with cookie support and normalized errors
- Dark/light theme foundation
- Vitest, React Testing Library and Supertest setup
- ESLint flat config and Prettier

## Installation

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run dev
```

## Environment variables

### Server

- `NODE_ENV`: `development`, `test` or `production`.
- `PORT`: Express listening port.
- `MONGODB_URI`: MongoDB connection string. Keep it server-side only.
- `CLIENT_ORIGINS`: Comma-separated exact frontend origins allowed by CORS.
- `TRUST_PROXY`: Set to `true` behind Render, Railway or another trusted reverse proxy.
- `LOG_LEVEL`: Minimum structured log level.
- `JSON_BODY_LIMIT`: Maximum JSON and URL-encoded request size.
- `API_RATE_LIMIT_WINDOW_MS`: General API rate-limit window.
- `API_RATE_LIMIT_MAX_REQUESTS`: Maximum requests per IP during the window.
- `LEAGUE_TIMEZONE`: IANA timezone used by later analytics phases.

### Client

- `VITE_API_BASE_URL`: Public backend origin only. Never place secrets in a `VITE_` variable.

## Health check

```bash
curl http://localhost:5000/api/v1/health
```

Expected shape:

```json
{
  "success": true,
  "message": "API health check completed.",
  "data": {
    "service": "mini-militia-api",
    "status": "ok",
    "environment": "development",
    "timestamp": "2026-07-20T00:00:00.000Z",
    "uptimeSeconds": 10,
    "database": {
      "status": "connected"
    }
  }
}
```

## Architecture rules

- `app.js` configures Express and is safe to import in tests.
- `server.js` owns database connection, HTTP listening and graceful shutdown.
- Controllers handle HTTP concerns.
- Services hold business logic.
- Validation middleware stores parsed input on `request.validated`.
- Models remain the source of database structure.
- Authentication and RBAC are not faked in this phase.
- Public and private routes will be separated as modules grow.

## Security notes

- The CORS origin list is exact; wildcard origins are not used with cookies.
- Backend errors are sanitized in production.
- Request payload size is limited before feature-specific uploads are added.
- Mongoose filter sanitization is enabled.
- Request IDs are returned for troubleshooting.
- Better Auth routes must be mounted before `express.json()` in Phase 5.

## Common mistakes

- Starting the server inside `app.js`, which makes integration tests difficult.
- committing `.env` files.
- adding database credentials to `VITE_` variables.
- allowing all CORS origins while using credentials.
- assigning parsed values back to `request.query` in Express 5.
- treating the current health endpoint as a complete infrastructure readiness probe.
- installing a custom JWT package before Better Auth implementation.

## Completion checklist

- [x] Root workspace created
- [x] Frontend and backend separated
- [x] Shared package created
- [x] Environment validation added
- [x] MongoDB lifecycle added
- [x] Central error handling added
- [x] Request validation structure added
- [x] Structured logging and request ID added
- [x] Health endpoint added
- [x] Vite and React configured
- [x] Tailwind CSS configured
- [x] React Router configured
- [x] TanStack Query configured
- [x] Axios configured
- [x] ESLint and Prettier configured
- [x] Test foundations configured
