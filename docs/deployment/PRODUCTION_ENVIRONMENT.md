# Production Environment Variables

## Backend required

| Variable                | Purpose                                | Example type          |
| ----------------------- | -------------------------------------- | --------------------- |
| `NODE_ENV`              | Enables production security behavior   | `production`          |
| `MONGODB_URI`           | MongoDB Atlas SRV connection           | Secret                |
| `MONGODB_DB_NAME`       | Application database                   | `mini_militia_league` |
| `CLIENT_ORIGINS`        | Exact comma-separated frontend origins | HTTPS URL             |
| `PUBLIC_APP_URL`        | Canonical public frontend URL          | HTTPS URL             |
| `PUBLIC_API_URL`        | Canonical public API URL               | HTTPS URL             |
| `BETTER_AUTH_URL`       | Better Auth API origin                 | Same as API origin    |
| `BETTER_AUTH_SECRET`    | Session/authentication secret          | Random 32+ chars      |
| `AUTH_COOKIE_SAME_SITE` | Cross-origin cookie policy             | `none`                |
| `TRUST_PROXY`           | Trust one platform proxy hop           | `true`                |
| `LEAGUE_TIMEZONE`       | Analytics boundary timezone            | `Asia/Dhaka`          |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary environment                 | Secret-adjacent       |
| `CLOUDINARY_API_KEY`    | Cloudinary server credential           | Secret                |
| `CLOUDINARY_API_SECRET` | Cloudinary server credential           | Secret                |
| `OCR_PROVIDER`          | OCR implementation                     | `google-vision`       |
| `GOOGLE_VISION_API_KEY` | Restricted Vision API key              | Secret                |

## Backend optional

| Variable                      | Behavior                                            |
| ----------------------------- | --------------------------------------------------- |
| `AI_PROVIDER=disabled`        | Uses deterministic statistics-based summaries       |
| `AI_PROVIDER=openai`          | Enables OpenAI-generated summaries after validation |
| `OPENAI_API_KEY`              | Required only with OpenAI provider                  |
| `OPENAI_MODEL`                | Configurable deployed OpenAI model ID               |
| `LOG_LEVEL`                   | `error`, `warn`, `info` or `debug`                  |
| `API_RATE_LIMIT_MAX_REQUESTS` | Global public API rate limit                        |

## Frontend public variables

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_AUTH_BASE_URL=https://api.example.com
```

Every `VITE_` value is exposed to the browser. Never place MongoDB, Better Auth, Cloudinary, Vision or OpenAI secrets in a frontend variable.

## Cookie and CORS matrix

For Vercel plus Render/Railway on different origins:

```env
AUTH_COOKIE_SAME_SITE=none
TRUST_PROXY=true
CLIENT_ORIGINS=https://frontend.example.com
```

Requirements:

- Both frontend and backend must use HTTPS.
- Axios and Better Auth client requests must include credentials.
- Backend CORS must return the exact requesting frontend origin.
- `CLIENT_ORIGINS=*` is invalid for credentialed cookies.
- Preview URLs are not trusted unless explicitly added; prefer a stable production domain.
