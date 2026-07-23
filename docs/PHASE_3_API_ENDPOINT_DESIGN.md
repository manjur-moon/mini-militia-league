# Phase 3 — API Endpoint Design

## Contract decisions

- Better Auth owns `/api/auth/*`; these routes keep Better Auth native request/response behavior.
- Application APIs use `/api/v1/*` and the project success/error envelope.
- Public player paths use human-readable IDs such as `MM001`; MongoDB ObjectIds are used for matches, rows, jobs and internal records.
- Only `verified` matches and `official` result snapshots can affect statistics, rankings, MVP, ratings, records, awards or AI source data.
- Role/status changes use application wrappers so last-admin checks, transactions and audit logs cannot be skipped by the frontend.
- Cross-site cookie deployment requires `X-CSRF-Token` for state-changing `/api/v1` calls plus strict Origin validation.

## Standard application responses

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

```json
{
  "success": false,
  "message": "Readable error message.",
  "errors": [
    { "code": "VALIDATION_ERROR", "field": "name", "message": "Name is required." }
  ],
  "requestId": "req_..."
}
```

`/api/auth/*` is the only exception because Better Auth owns those responses.

## Shared query rules

- `page`: integer >= 1.
- `limit`: integer 1–100; public media-heavy lists may use a smaller maximum.
- `sortOrder`: `asc` or `desc`.
- Date inputs: ISO-8601; persisted in UTC and interpreted using the configured league timezone.
- Unknown query/body keys are rejected on mutation contracts.
- Search strings are trimmed, length-limited and escaped before regex use.
- Object IDs, `MM###` IDs, enums and sort fields use allowlists.

## Security rules

- Session validation and authorization happen in the backend.
- Mutations require CSRF protection; high-impact actions also require a fresh session and idempotency key.
- File validation checks signatures and decoded image properties, not only filename or MIME type.
- Audit snapshots are recursively sanitized.
- Rate limits are stricter for auth, uploads, OCR retries, image rendering, AI generation and recalculation.
- Public DTOs never include Better Auth session/account records, user email, tokens, linked user IDs or raw OCR payloads.

## System

| Method | Path             | Access | Purpose                         | Paginated |
| ------ | ---------------- | ------ | ------------------------------- | --------- |
| `GET`  | `/api/v1/health` | Public | Return API and database health. | No        |

### `GET /api/v1/health`

- **Access:** Public
- **Parameters:** None
- **Body:** None
- **Validation:** No input.
- **Success:** 200 — status, timestamp, environment-safe service checks.
- **Errors:** 503 SERVICE_UNAVAILABLE
- **Pagination:** Not applicable.
- **Security:** Aggressive public rate limit; never expose secrets or connection strings.

## Security

| Method | Path                          | Access               | Purpose                                     | Paginated |
| ------ | ----------------------------- | -------------------- | ------------------------------------------- | --------- |
| `GET`  | `/api/v1/security/csrf-token` | Public session-aware | Issue or rotate a double-submit CSRF token. | No        |

### `GET /api/v1/security/csrf-token`

- **Access:** Public session-aware
- **Parameters:** None
- **Body:** None
- **Validation:** Session may be absent; token must be cryptographically random.
- **Success:** 200 — csrfToken and expiry.
- **Errors:** 429 RATE_LIMITED, 500 INTERNAL_ERROR
- **Pagination:** Not applicable.
- **Security:** Required before cookie-authenticated mutation requests when frontend and API are cross-site.

## Authentication

| Method | Path                                | Access               | Purpose                                    | Paginated |
| ------ | ----------------------------------- | -------------------- | ------------------------------------------ | --------- |
| `POST` | `/api/auth/sign-up/email`           | Public               | Register with email and password.          | No        |
| `POST` | `/api/auth/sign-in/email`           | Public               | Create an email/password session.          | No        |
| `POST` | `/api/auth/sign-out`                | Authenticated        | End the current session.                   | No        |
| `GET`  | `/api/auth/get-session`             | Public session-aware | Read the current Better Auth session.      | No        |
| `POST` | `/api/auth/send-verification-email` | Public               | Send or resend an email verification link. | No        |
| `POST` | `/api/auth/request-password-reset`  | Public               | Request a password-reset email.            | No        |
| `POST` | `/api/auth/reset-password`          | Public token         | Reset password with a valid token.         | No        |
| `POST` | `/api/auth/change-password`         | Authenticated        | Change current password.                   | No        |
| `POST` | `/api/auth/revoke-session`          | Authenticated        | Revoke one of the current user’s sessions. | No        |
| `POST` | `/api/auth/revoke-other-sessions`   | Authenticated        | Revoke all sessions except current.        | No        |

### `POST /api/auth/sign-up/email`

- **Access:** Public
- **Parameters:** None
- **Body:** name:string, email:string, password:string, callbackURL?:url
- **Validation:** Valid email; name 2–80; password 8–128; role and linkedPlayerId rejected from client.
- **Success:** Better Auth native sign-up response.
- **Errors:** 400 INVALID_REQUEST, 403 EMAIL_NOT_VERIFIED, 422 USER_ALREADY_EXISTS, 429 RATE_LIMITED
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

### `POST /api/auth/sign-in/email`

- **Access:** Public
- **Parameters:** None
- **Body:** email:string, password:string, rememberMe?:boolean, callbackURL?:url
- **Validation:** Valid email; password required; disabled/banned accounts rejected.
- **Success:** Better Auth native sign-in response plus session cookie.
- **Errors:** 400 INVALID_CREDENTIALS, 403 ACCOUNT_DISABLED_OR_UNVERIFIED, 429 RATE_LIMITED
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

### `POST /api/auth/sign-out`

- **Access:** Authenticated
- **Parameters:** None
- **Body:** None
- **Validation:** Valid session cookie.
- **Success:** Better Auth native sign-out response; clears current cookie.
- **Errors:** 401 UNAUTHENTICATED
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

### `GET /api/auth/get-session`

- **Access:** Public session-aware
- **Parameters:** None
- **Body:** None
- **Validation:** Cookie/header parsed by Better Auth.
- **Success:** Better Auth session object or null.
- **Errors:** 500 AUTH_PROVIDER_ERROR
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

### `POST /api/auth/send-verification-email`

- **Access:** Public
- **Parameters:** None
- **Body:** email:string, callbackURL?:url
- **Validation:** Valid email; generic response prevents account enumeration.
- **Success:** Better Auth native response.
- **Errors:** 400 INVALID_REQUEST, 429 RATE_LIMITED
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

### `POST /api/auth/request-password-reset`

- **Access:** Public
- **Parameters:** None
- **Body:** email:string, redirectTo?:url
- **Validation:** Valid email; generic response prevents account enumeration.
- **Success:** Better Auth native generic success response.
- **Errors:** 400 INVALID_REQUEST, 429 RATE_LIMITED
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

### `POST /api/auth/reset-password`

- **Access:** Public token
- **Parameters:** None
- **Body:** token:string, newPassword:string
- **Validation:** Token required and unexpired; password 8–128; revoke other sessions per configuration.
- **Success:** Better Auth native response.
- **Errors:** 400 INVALID_OR_EXPIRED_TOKEN, 422 WEAK_PASSWORD, 429 RATE_LIMITED
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

### `POST /api/auth/change-password`

- **Access:** Authenticated
- **Parameters:** None
- **Body:** currentPassword:string, newPassword:string, revokeOtherSessions?:boolean
- **Validation:** Fresh session may be required; password 8–128.
- **Success:** Better Auth native response.
- **Errors:** 400 INVALID_CURRENT_PASSWORD, 401 UNAUTHENTICATED, 422 WEAK_PASSWORD
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

### `POST /api/auth/revoke-session`

- **Access:** Authenticated
- **Parameters:** None
- **Body:** token:string
- **Validation:** Token must belong to current user.
- **Success:** Better Auth native response.
- **Errors:** 400 INVALID_TOKEN, 401 UNAUTHENTICATED
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

### `POST /api/auth/revoke-other-sessions`

- **Access:** Authenticated
- **Parameters:** None
- **Body:** None
- **Validation:** Fresh session recommended.
- **Success:** Better Auth native response.
- **Errors:** 401 UNAUTHENTICATED
- **Pagination:** Not applicable.
- **Security:** Owned by Better Auth; mounted before express.json(); credentialed CORS; Better Auth trustedOrigins and native CSRF/origin protections.

## Users

| Method   | Path                                          | Access        | Purpose                                                        | Paginated |
| -------- | --------------------------------------------- | ------------- | -------------------------------------------------------------- | --------- |
| `GET`    | `/api/v1/me`                                  | Authenticated | Return sanitized current-user, role and linked-player context. | No        |
| `GET`    | `/api/v1/users`                               | Admin         | List user accounts.                                            | Yes       |
| `GET`    | `/api/v1/users/{userId}`                      | Admin         | Get one sanitized user account.                                | No        |
| `PATCH`  | `/api/v1/users/{userId}/role`                 | Admin         | Change a user role through guarded workflow.                   | No        |
| `PATCH`  | `/api/v1/users/{userId}/status`               | Admin         | Ban/disable or reactivate an account.                          | No        |
| `PUT`    | `/api/v1/users/{userId}/player-link`          | Admin         | Link a user account to one player profile.                     | No        |
| `DELETE` | `/api/v1/users/{userId}/player-link`          | Admin         | Remove a user-player link.                                     | No        |
| `GET`    | `/api/v1/users/{userId}/sessions`             | Admin         | List safe session metadata for a user.                         | Yes       |
| `DELETE` | `/api/v1/users/{userId}/sessions/{sessionId}` | Admin         | Revoke one user session.                                       | No        |
| `DELETE` | `/api/v1/users/{userId}/sessions`             | Admin         | Revoke every session for a user.                               | No        |

### `GET /api/v1/me`

- **Access:** Authenticated
- **Parameters:** include=player,permissions
- **Body:** None
- **Validation:** include enum; never return account password hash, session token or private adapter fields.
- **Success:** 200 — sanitized user, session summary, permissions and optional linked player.
- **Errors:** 401 UNAUTHENTICATED
- **Pagination:** Not applicable.
- **Security:** Cookie session; response field allowlist.

### `GET /api/v1/users`

- **Access:** Admin
- **Parameters:** page, limit, search, role, status, linked, sortBy, sortOrder
- **Body:** None
- **Validation:** page>=1; limit 1–100; role enum; status active|banned; sort allowlist.
- **Success:** 200 — sanitized users and standard pagination.
- **Errors:** 400 INVALID_QUERY, 401 UNAUTHENTICATED, 403 FORBIDDEN
- **Pagination:** Standard pagination object.
- **Security:** Admin only; email search rate-limited; no account/session secrets.

### `GET /api/v1/users/{userId}`

- **Access:** Admin
- **Parameters:** userId:string
- **Body:** None
- **Validation:** Non-empty Better Auth user ID.
- **Success:** 200 — user, role, ban state, linked player and safe session count.
- **Errors:** 401 UNAUTHENTICATED, 403 FORBIDDEN, 404 USER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Admin only; field allowlist.

### `PATCH /api/v1/users/{userId}/role`

- **Access:** Admin
- **Parameters:** userId:string
- **Body:** role: player|moderator|admin, reason:string, expectedUpdatedAt?:datetime
- **Validation:** Allowed role only; reason 5–500; cannot remove final active admin; cannot self-demote final admin.
- **Success:** 200 — updated sanitized user.
- **Errors:** 400 VALIDATION_ERROR, 409 LAST_ADMIN_PROTECTED, 409 STALE_WRITE, 404 USER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; audit log; direct Better Auth set-role route not used by UI.

### `PATCH /api/v1/users/{userId}/status`

- **Access:** Admin
- **Parameters:** userId:string
- **Body:** status:active|banned, reason:string, banExpiresIn?:integer
- **Validation:** Cannot ban final admin; reason required when banning; expiry 60–31536000 seconds.
- **Success:** 200 — updated account status; sessions revoked on ban.
- **Errors:** 400 VALIDATION_ERROR, 409 LAST_ADMIN_PROTECTED, 404 USER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; audit log; revoke sessions on ban.

### `PUT /api/v1/users/{userId}/player-link`

- **Access:** Admin
- **Parameters:** userId:string
- **Body:** playerId:MM###, reason?:string
- **Validation:** Both entities exist; one-to-one uniqueness; moderator/admin may link without being players.
- **Success:** 200 — linked user/player summary.
- **Errors:** 404 USER_OR_PLAYER_NOT_FOUND, 409 USER_ALREADY_LINKED, 409 PLAYER_ALREADY_LINKED
- **Pagination:** Not applicable.
- **Security:** CSRF token; transaction where supported; audit and player notification.

### `DELETE /api/v1/users/{userId}/player-link`

- **Access:** Admin
- **Parameters:** userId:string
- **Body:** reason:string
- **Validation:** Existing link required; reason 5–500.
- **Success:** 200 — unlinked user/player summary.
- **Errors:** 404 LINK_NOT_FOUND, 409 STALE_WRITE
- **Pagination:** Not applicable.
- **Security:** CSRF token; transaction where supported; audit log.

### `GET /api/v1/users/{userId}/sessions`

- **Access:** Admin
- **Parameters:** userId:string, page, limit
- **Body:** None
- **Validation:** page>=1; limit<=100; session tokens never returned.
- **Success:** 200 — device/session metadata and pagination.
- **Errors:** 404 USER_NOT_FOUND
- **Pagination:** Standard pagination object.
- **Security:** Admin only; redact session tokens and exact cookie values.

### `DELETE /api/v1/users/{userId}/sessions/{sessionId}`

- **Access:** Admin
- **Parameters:** userId:string, sessionId:string
- **Body:** reason?:string
- **Validation:** Session must belong to user; current final-admin safeguard where relevant.
- **Success:** 200 — revoked=true.
- **Errors:** 404 SESSION_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; audit event without token value.

### `DELETE /api/v1/users/{userId}/sessions`

- **Access:** Admin
- **Parameters:** userId:string
- **Body:** reason?:string
- **Validation:** User exists.
- **Success:** 200 — revokedCount.
- **Errors:** 404 USER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit log.

## Players

| Method   | Path                                        | Access | Purpose                                                       | Paginated |
| -------- | ------------------------------------------- | ------ | ------------------------------------------------------------- | --------- |
| `GET`    | `/api/v1/players`                           | Public | Search and list player profiles.                              | Yes       |
| `POST`   | `/api/v1/players`                           | Admin  | Create a player with atomic human-readable ID.                | No        |
| `GET`    | `/api/v1/players/{playerId}`                | Public | Get a public player summary.                                  | No        |
| `PATCH`  | `/api/v1/players/{playerId}`                | Admin  | Update editable player fields.                                | No        |
| `PATCH`  | `/api/v1/players/{playerId}/status`         | Admin  | Activate or deactivate a player without destructive deletion. | No        |
| `POST`   | `/api/v1/players/{playerId}/photo`          | Admin  | Upload or replace a player photo.                             | No        |
| `DELETE` | `/api/v1/players/{playerId}/photo`          | Admin  | Remove current player photo reference.                        | No        |
| `GET`    | `/api/v1/players/{playerId}/profile`        | Public | Return complete public profile composition.                   | No        |
| `GET`    | `/api/v1/players/{playerId}/matches`        | Public | List a player’s verified match history.                       | Yes       |
| `GET`    | `/api/v1/players/{playerId}/statistics`     | Public | Return official all-time or period statistics.                | No        |
| `GET`    | `/api/v1/players/{playerId}/analytics`      | Public | Return trend-series data for charts.                          | No        |
| `GET`    | `/api/v1/players/{playerId}/records`        | Public | Return documented personal records.                           | No        |
| `GET`    | `/api/v1/players/{playerId}/card`           | Public | Return player-card data and share metadata.                   | No        |
| `GET`    | `/api/v1/players/{playerId}/card/image.svg` | Public | Render a cacheable SVG player-card image.                     | No        |
| `GET`    | `/api/v1/players/{playerId}/card/image.png` | Public | Render a downloadable 1200×1500 PNG player-card image.        | No        |

### `GET /api/v1/players`

- **Access:** Public
- **Parameters:** page, limit, search, status, joinedFrom, joinedTo, sortBy, sortOrder
- **Body:** None
- **Validation:** limit<=50 public; status enum; ISO dates; sort allowlist.
- **Success:** 200 — public player cards and pagination.
- **Errors:** 400 INVALID_QUERY
- **Pagination:** Standard pagination object.
- **Security:** Public rate limit; explicit public projection; inactive filter defaults to active for visitors.

### `POST /api/v1/players`

- **Access:** Admin
- **Parameters:** None
- **Body:** name:string, aliases?:string[], joinDate:date, status?:active|inactive
- **Validation:** Name 2–80; aliases unique normalized; joinDate valid; client playerId rejected.
- **Success:** 201 — created player including generated MM### ID.
- **Errors:** 400 VALIDATION_ERROR, 409 DUPLICATE_PLAYER_ID_RETRY_FAILED, 409 DUPLICATE_LINK
- **Pagination:** Not applicable.
- **Security:** CSRF token; atomic counter; unique index; audit log.

### `GET /api/v1/players/{playerId}`

- **Access:** Public
- **Parameters:** playerId:MM###
- **Body:** None
- **Validation:** Must match /^MM\d{3,}$/.
- **Success:** 200 — public player data.
- **Errors:** 404 PLAYER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Public projection excludes linked user ID and internal audit fields.

### `PATCH /api/v1/players/{playerId}`

- **Access:** Admin
- **Parameters:** playerId:MM###
- **Body:** name?:string, aliases?:string[], joinDate?:date, expectedUpdatedAt?:datetime
- **Validation:** At least one field; playerId immutable; optimistic concurrency.
- **Success:** 200 — updated player.
- **Errors:** 400 VALIDATION_ERROR, 404 PLAYER_NOT_FOUND, 409 STALE_WRITE
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit before/after; normalized name generated server-side.

### `PATCH /api/v1/players/{playerId}/status`

- **Access:** Admin
- **Parameters:** playerId:MM###
- **Body:** status:active|inactive, reason:string
- **Validation:** Reason required; historical matches preserved.
- **Success:** 200 — updated status.
- **Errors:** 400 VALIDATION_ERROR, 404 PLAYER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit log; never delete match history.

### `POST /api/v1/players/{playerId}/photo`

- **Access:** Admin
- **Parameters:** playerId:MM###
- **Body:** multipart/form-data field image
- **Validation:** JPEG/PNG/WebP signature; <=5MB; image dimensions; one file only.
- **Success:** 200 — optimized Cloudinary asset metadata.
- **Errors:** 400 INVALID_FILE, 404 PLAYER_NOT_FOUND, 413 FILE_TOO_LARGE, 502 STORAGE_ERROR
- **Pagination:** Not applicable.
- **Security:** CSRF token; authorized upload; random Cloudinary public ID; delete old asset only after successful DB update.

### `DELETE /api/v1/players/{playerId}/photo`

- **Access:** Admin
- **Parameters:** playerId:MM###
- **Body:** reason?:string
- **Validation:** Player and photo must exist.
- **Success:** 200 — profileImage=null.
- **Errors:** 404 PLAYER_OR_PHOTO_NOT_FOUND, 502 STORAGE_ERROR
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; Cloudinary deletion after safe reference update policy.

### `GET /api/v1/players/{playerId}/profile`

- **Access:** Public
- **Parameters:** playerId:MM###, period?:weekly|monthly|season|all_time, seasonId?:ObjectId
- **Body:** None
- **Validation:** Period enum; season required only for season period.
- **Success:** 200 — player, statistics, ranks, ratings, title, achievements, recent verified matches.
- **Errors:** 400 INVALID_QUERY, 404 PLAYER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Public data only; cached composition; no user email or linkedUserId.

### `GET /api/v1/players/{playerId}/matches`

- **Access:** Public
- **Parameters:** playerId:MM###, page, limit, from, to, seasonId, sortOrder
- **Body:** None
- **Validation:** Verified only; date range max 366 days for public; limit<=50.
- **Success:** 200 — verified match results and pagination.
- **Errors:** 400 INVALID_QUERY, 404 PLAYER_NOT_FOUND
- **Pagination:** Standard pagination object.
- **Security:** Public screenshot URL may use transformed image; no raw OCR data.

### `GET /api/v1/players/{playerId}/statistics`

- **Access:** Public
- **Parameters:** playerId:MM###, periodType?:all_time|weekly|monthly|season, startDate?, endDate?, seasonId?
- **Body:** None
- **Validation:** Period inputs mutually valid; custom date range limited.
- **Success:** 200 — finite official statistics and source metadata.
- **Errors:** 400 INVALID_PERIOD, 404 PLAYER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Verified source only; never accept client calculations.

### `GET /api/v1/players/{playerId}/analytics`

- **Access:** Public
- **Parameters:** playerId:MM###, range:7d|30d|season, metrics?:kills,deaths,kdr,rank,activity,firstPlaces,lastPlaces
- **Body:** None
- **Validation:** Metric allowlist; max 7 metrics; range enum.
- **Success:** 200 — ordered UTC buckets with league-timezone labels.
- **Errors:** 400 INVALID_QUERY, 404 PLAYER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Aggregation/cached data from verified matches only; response size bounded.

### `GET /api/v1/players/{playerId}/records`

- **Access:** Public
- **Parameters:** playerId:MM###, periodType?:all_time|season, seasonId?
- **Body:** None
- **Validation:** Season ID required for season.
- **Success:** 200 — records with evidence match IDs and calculation version.
- **Errors:** 400 INVALID_QUERY, 404 PLAYER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Verified evidence only; no arbitrary “best” score without version.

### `GET /api/v1/players/{playerId}/card`

- **Access:** Public
- **Parameters:** playerId:MM###
- **Body:** None
- **Validation:** Player exists; public data projection.
- **Success:** 200 — card data, fallback image and canonical share URL.
- **Errors:** 404 PLAYER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Public rate limit; cached response.

### `POST /api/v1/players/{playerId}/card/render`

- **Access:** Authenticated
- **Parameters:** playerId:MM###
- **Body:** format?:png|webp, scale?:1|2
- **Validation:** Allowed format/scale only.
- **Success:** 202 — render request accepted or 200 cached image URL.
- **Errors:** 404 PLAYER_NOT_FOUND, 429 RENDER_LIMITED, 503 RENDERER_UNAVAILABLE
- **Pagination:** Not applicable.
- **Security:** CSRF token; per-user render limit; no arbitrary HTML/image URLs.

## Uploads

| Method | Path                      | Access           | Purpose                                                  | Paginated |
| ------ | ------------------------- | ---------------- | -------------------------------------------------------- | --------- |
| `POST` | `/api/v1/matches/uploads` | Moderator, Admin | Upload a result screenshot and create match/OCR records. | No        |

### `POST /api/v1/matches/uploads`

- **Access:** Moderator, Admin
- **Parameters:** Idempotency-Key header
- **Body:** multipart: screenshot, matchDate, timezone?, participantCount, seasonId?
- **Validation:** Image signature JPEG/PNG/WebP; <=10MB; matchDate ISO; participantCount 2–50; SHA-256 duplicate check.
- **Success:** 202 — match, screenshot metadata, OCR job and polling URL.
- **Errors:** 400 VALIDATION_ERROR, 409 DUPLICATE_SCREENSHOT, 413 FILE_TOO_LARGE, 415 UNSUPPORTED_MEDIA_TYPE, 502 STORAGE_ERROR
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotency key; upload rate limit; original preserved; never trust filename/MIME alone.

## OCR

| Method | Path                                  | Access           | Purpose                                               | Paginated |
| ------ | ------------------------------------- | ---------------- | ----------------------------------------------------- | --------- |
| `GET`  | `/api/v1/ocr-jobs/{jobId}`            | Moderator, Admin | Read persisted OCR processing status.                 | No        |
| `GET`  | `/api/v1/matches/{matchId}/ocr`       | Moderator, Admin | Read OCR job, raw text and extracted rows for review. | No        |
| `POST` | `/api/v1/matches/{matchId}/ocr/retry` | Moderator, Admin | Retry a failed OCR job.                               | No        |

### `GET /api/v1/ocr-jobs/{jobId}`

- **Access:** Moderator, Admin
- **Parameters:** jobId:ObjectId
- **Body:** None
- **Validation:** Valid ObjectId.
- **Success:** 200 — status, attempts, safe provider metadata, errors and timestamps.
- **Errors:** 404 OCR_JOB_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Authorized queue access; raw provider credentials/tokens excluded.

### `GET /api/v1/matches/{matchId}/ocr`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId
- **Body:** None
- **Validation:** Valid ObjectId.
- **Success:** 200 — match evidence, OCR status, confidence, raw text and parsed rows.
- **Errors:** 404 MATCH_OR_OCR_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Protected; raw OCR response sanitized; signed/authorized original image URL.

### `POST /api/v1/matches/{matchId}/ocr/retry`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId; Idempotency-Key header
- **Body:** reason?:string
- **Validation:** Only processing_failed/failed jobs; retry cap; no active lock.
- **Success:** 202 — reset queued job and polling URL.
- **Errors:** 404 OCR_JOB_NOT_FOUND, 409 OCR_NOT_RETRYABLE, 409 OCR_ALREADY_PROCESSING, 429 RETRY_LIMITED
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotency; atomic lock; audit operational event.

## Matches

| Method   | Path                                           | Access                                        | Purpose                                            | Paginated |
| -------- | ---------------------------------------------- | --------------------------------------------- | -------------------------------------------------- | --------- |
| `GET`    | `/api/v1/matches`                              | Public; elevated views for Moderator/Admin    | List matches and screenshot archive.               | Yes       |
| `GET`    | `/api/v1/matches/{matchId}`                    | Public if verified; Moderator/Admin otherwise | Get match details.                                 | No        |
| `PATCH`  | `/api/v1/matches/{matchId}`                    | Moderator, Admin                              | Update pending match metadata before verification. | No        |
| `POST`   | `/api/v1/matches/{matchId}/results`            | Moderator, Admin                              | Add a manual pending result row.                   | No        |
| `PATCH`  | `/api/v1/matches/{matchId}/results/{resultId}` | Moderator, Admin                              | Correct one pending OCR/manual result.             | No        |
| `PUT`    | `/api/v1/matches/{matchId}/results`            | Moderator, Admin                              | Bulk save all review rows.                         | No        |
| `DELETE` | `/api/v1/matches/{matchId}/results/{resultId}` | Moderator, Admin                              | Remove a pending result row.                       | No        |

### `GET /api/v1/matches`

- **Access:** Public; elevated views for Moderator/Admin
- **Parameters:** page, limit, search, status, from, to, seasonId, uploadedBy, sortBy, sortOrder
- **Body:** None
- **Validation:** Visitors forced to status=verified; elevated status enum; limit<=50; date validation.
- **Success:** 200 — role-appropriate match summaries and pagination.
- **Errors:** 400 INVALID_QUERY
- **Pagination:** Standard pagination object.
- **Security:** Public projection hides raw OCR and actor IDs; moderator/admin authorization for pending archive.

### `GET /api/v1/matches/{matchId}`

- **Access:** Public if verified; Moderator/Admin otherwise
- **Parameters:** matchId:ObjectId
- **Body:** None
- **Validation:** Valid ObjectId; visibility by status and role.
- **Success:** 200 — verified public match or protected review detail.
- **Errors:** 403 MATCH_NOT_PUBLIC, 404 MATCH_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Field projection by role; raw/corrected data protected.

### `PATCH /api/v1/matches/{matchId}`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId
- **Body:** matchDate?:datetime, timezone?:IANA, seasonId?:ObjectId|null, participantCount?:integer, duplicateReviewNote?:string, expectedUpdatedAt?:datetime
- **Validation:** Allowed only before verified/rejected; status not client-editable; participant count 2–50.
- **Success:** 200 — updated pending match.
- **Errors:** 400 VALIDATION_ERROR, 409 MATCH_IMMUTABLE, 409 STALE_WRITE, 404 MATCH_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit material changes; no screenshot replacement.

### `POST /api/v1/matches/{matchId}/results`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId
- **Body:** playerId:ObjectId, playerName:string, kills:int, deaths:int, placement:int, reason?:string
- **Validation:** Match reviewable; unique player/placement proposal; non-negative scores.
- **Success:** 201 — pending manual row.
- **Errors:** 400 VALIDATION_ERROR, 409 DUPLICATE_PLAYER_OR_PLACEMENT, 409 MATCH_IMMUTABLE
- **Pagination:** Not applicable.
- **Security:** CSRF token; server assigns rowIndex; raw/manual provenance retained.

### `PATCH /api/v1/matches/{matchId}/results/{resultId}`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId, resultId:ObjectId
- **Body:** playerId:ObjectId, playerName:string, kills:int, deaths:int, placement:int, reason?:string
- **Validation:** Match and row pending; player exists; values finite integers; uniqueness across proposed rows.
- **Success:** 200 — corrected result with extracted data unchanged.
- **Errors:** 400 VALIDATION_ERROR, 404 RESULT_NOT_FOUND, 409 DUPLICATE_PLAYER_OR_PLACEMENT, 409 MATCH_IMMUTABLE
- **Pagination:** Not applicable.
- **Security:** CSRF token; correctedBy/At server-generated; raw extracted object immutable.

### `PUT /api/v1/matches/{matchId}/results`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId
- **Body:** results:[{resultId?, playerId, playerName, kills, deaths, placement, reason?}]
- **Validation:** Array length 2–50; unique result IDs/player IDs/placements; participant count consistency.
- **Success:** 200 — normalized pending result set and validation warnings.
- **Errors:** 400 VALIDATION_ERROR, 409 DUPLICATE_PLAYER_OR_PLACEMENT, 409 PARTICIPANT_COUNT_MISMATCH, 409 MATCH_IMMUTABLE
- **Pagination:** Not applicable.
- **Security:** CSRF token; transaction; no official snapshot created.

### `DELETE /api/v1/matches/{matchId}/results/{resultId}`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId, resultId:ObjectId
- **Body:** reason:string
- **Validation:** Only pending row; reason required.
- **Success:** 200 — removed pending row summary.
- **Errors:** 404 RESULT_NOT_FOUND, 409 MATCH_IMMUTABLE
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit correction metadata; extracted evidence remains available through OCR raw response.

## Verification

| Method | Path                                                           | Access           | Purpose                                               | Paginated |
| ------ | -------------------------------------------------------------- | ---------------- | ----------------------------------------------------- | --------- |
| `POST` | `/api/v1/matches/{matchId}/verify`                             | Moderator, Admin | Atomically verify a reviewed match.                   | No        |
| `POST` | `/api/v1/matches/{matchId}/reject`                             | Moderator, Admin | Reject a non-verified match.                          | No        |
| `GET`  | `/api/v1/matches/{matchId}/revisions`                          | Moderator, Admin | List controlled correction revisions.                 | Yes       |
| `POST` | `/api/v1/matches/{matchId}/revisions`                          | Admin            | Propose a verified-match correction.                  | No        |
| `GET`  | `/api/v1/matches/{matchId}/revisions/{revisionNumber}`         | Moderator, Admin | Get one correction revision.                          | No        |
| `POST` | `/api/v1/matches/{matchId}/revisions/{revisionNumber}/approve` | Admin            | Approve correction and recalculate all affected data. | No        |
| `POST` | `/api/v1/matches/{matchId}/revisions/{revisionNumber}/reject`  | Admin            | Reject a pending correction revision.                 | No        |

### `POST /api/v1/matches/{matchId}/verify`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId; Idempotency-Key header
- **Body:** expectedRevision:int, note?:string
- **Validation:** Status needs_review/extracted; all rows valid/matched; unique players/placements; participant count; duplicate warning resolved; active season rule.
- **Success:** 200 — verified match, official result count and recalculation summary.
- **Errors:** 400 MATCH_VALIDATION_FAILED, 409 ALREADY_VERIFIED, 409 DUPLICATE_MATCH_SUSPECTED, 409 REVISION_CONFLICT, 503 RECALCULATION_FAILED
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotency; transaction; official snapshot; audit; cache invalidation; notification.

### `POST /api/v1/matches/{matchId}/reject`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId; Idempotency-Key header
- **Body:** reason:string, expectedRevision:int
- **Validation:** Reason 5–500; cannot reject verified match.
- **Success:** 200 — rejected match.
- **Errors:** 400 VALIDATION_ERROR, 409 MATCH_IMMUTABLE, 409 REVISION_CONFLICT
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotency; audit; no official statistics changes.

### `GET /api/v1/matches/{matchId}/revisions`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId, page, limit, status
- **Body:** None
- **Validation:** Status enum pending|approved|rejected; limit<=50.
- **Success:** 200 — revision summaries and pagination.
- **Errors:** 404 MATCH_NOT_FOUND
- **Pagination:** Standard pagination object.
- **Security:** Protected audit-like data; no secret fields.

### `POST /api/v1/matches/{matchId}/revisions`

- **Access:** Admin
- **Parameters:** matchId:ObjectId
- **Body:** reason:string, matchChanges?:object, results:[{resultId, playerId, playerName, kills, deaths, placement}], expectedRevision:int
- **Validation:** Verified match only; full proposed snapshot validates; reason required; no duplicate player/placement.
- **Success:** 201 — pending revision with before/proposed snapshots.
- **Errors:** 400 VALIDATION_ERROR, 409 MATCH_NOT_VERIFIED, 409 REVISION_CONFLICT, 409 OPEN_REVISION_EXISTS
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; immutable before snapshot; audit creation.

### `GET /api/v1/matches/{matchId}/revisions/{revisionNumber}`

- **Access:** Moderator, Admin
- **Parameters:** matchId:ObjectId, revisionNumber:int
- **Body:** None
- **Validation:** revisionNumber>=1.
- **Success:** 200 — sanitized before/proposed/diff/evidence.
- **Errors:** 404 REVISION_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Protected; actor IDs safe but no tokens/IP beyond authorized audit policy.

### `POST /api/v1/matches/{matchId}/revisions/{revisionNumber}/approve`

- **Access:** Admin
- **Parameters:** matchId:ObjectId, revisionNumber:int; Idempotency-Key
- **Body:** approvalReason?:string, expectedMatchRevision:int
- **Validation:** Revision pending; full revalidation; match revision unchanged since proposal.
- **Success:** 200 — corrected official match, recalculation and superseded-cache summary.
- **Errors:** 409 REVISION_NOT_PENDING, 409 MATCH_CHANGED, 422 CORRECTION_INVALID, 503 RECALCULATION_FAILED
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; idempotent transaction; audit before/after; dependent recalculation.

### `POST /api/v1/matches/{matchId}/revisions/{revisionNumber}/reject`

- **Access:** Admin
- **Parameters:** matchId:ObjectId, revisionNumber:int
- **Body:** reason:string
- **Validation:** Pending revision; reason 5–500.
- **Success:** 200 — rejected revision.
- **Errors:** 404 REVISION_NOT_FOUND, 409 REVISION_NOT_PENDING
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit log; official match unchanged.

## Statistics

| Method | Path                                   | Access | Purpose                                           | Paginated |
| ------ | -------------------------------------- | ------ | ------------------------------------------------- | --------- |
| `GET`  | `/api/v1/statistics/overview`          | Public | Return league-wide verified summary metrics.      | No        |
| `POST` | `/api/v1/admin/statistics/recalculate` | Admin  | Explicitly rebuild persisted official aggregates. | No        |

### `GET /api/v1/statistics/overview`

- **Access:** Public
- **Parameters:** periodType?:weekly|monthly|season|all_time, seasonId?, date?
- **Body:** None
- **Validation:** Valid period selection.
- **Success:** 200 — totals, averages, records and source metadata.
- **Errors:** 400 INVALID_PERIOD
- **Pagination:** Not applicable.
- **Security:** Cached/aggregated verified data; no raw OCR.

### `POST /api/v1/admin/statistics/recalculate`

- **Access:** Admin
- **Parameters:** Idempotency-Key header
- **Body:** scope:player|match|period|season|all, playerId?, matchId?, period?, seasonId?, reason:string
- **Validation:** Scope-dependent IDs; reason required; only one conflicting rebuild lock.
- **Success:** 202 — recalculation accepted with operation ID and affected scopes.
- **Errors:** 400 VALIDATION_ERROR, 409 RECALCULATION_IN_PROGRESS, 429 OPERATION_LIMITED
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; idempotency; audit; bounded workloads.

## Leaderboards

| Method | Path                                   | Access | Purpose                                                     | Paginated |
| ------ | -------------------------------------- | ------ | ----------------------------------------------------------- | --------- |
| `GET`  | `/api/v1/leaderboards`                 | Public | Return one validated leaderboard.                           | Yes       |
| `GET`  | `/api/v1/leaderboards/weekly/summary`  | Public | Return weekly top-three, metric previews and weekly totals. | No        |
| `GET`  | `/api/v1/leaderboards/monthly/summary` | Public | Return monthly top ten and comparison summary.              | No        |

### `GET /api/v1/leaderboards`

- **Access:** Public
- **Parameters:** periodType:weekly|monthly|season|all_time, metric:totalKills|totalDeaths|kdr|activity|firstPlaces|lastPlaces|overallRating|mvpScore, startDate?, endDate?, seasonId?, page, limit
- **Body:** None
- **Validation:** Metric/period compatibility; minimum-match rules; limit<=100.
- **Success:** 200 — ranked entries, tie-break rules, formula/source version and pagination.
- **Errors:** 400 INVALID_LEADERBOARD_QUERY
- **Pagination:** Standard pagination object.
- **Security:** Snapshot/cache preferred; verified data only; deterministic tie-break.

### `GET /api/v1/leaderboards/weekly/summary`

- **Access:** Public
- **Parameters:** weekStart?:date
- **Body:** None
- **Validation:** weekStart normalized in league timezone; current week default.
- **Success:** 200 — boundary, top three, MVP preview, metric leaders and source version.
- **Errors:** 400 INVALID_WEEK
- **Pagination:** Not applicable.
- **Security:** Cached snapshot; verified matches only.

### `GET /api/v1/leaderboards/monthly/summary`

- **Access:** Public
- **Parameters:** month?:YYYY-MM
- **Body:** None
- **Validation:** Valid month not beyond allowed future range.
- **Success:** 200 — monthly leaders, totals and previous-month comparison.
- **Errors:** 400 INVALID_MONTH
- **Pagination:** Not applicable.
- **Security:** Cached verified aggregates.

## MVP

| Method | Path                                     | Access | Purpose                                         | Paginated |
| ------ | ---------------------------------------- | ------ | ----------------------------------------------- | --------- |
| `GET`  | `/api/v1/mvp/awards`                     | Public | List historical MVP awards.                     | Yes       |
| `GET`  | `/api/v1/mvp/current`                    | Public | Get current award for one type/period.          | No        |
| `GET`  | `/api/v1/mvp/configs`                    | Admin  | List versioned MVP formula configurations.      | Yes       |
| `POST` | `/api/v1/mvp/configs`                    | Admin  | Create a new inactive MVP formula version.      | No        |
| `POST` | `/api/v1/mvp/configs/{version}/activate` | Admin  | Activate an MVP config for future calculations. | No        |
| `POST` | `/api/v1/admin/mvp/recalculate`          | Admin  | Explicitly calculate or recalculate MVP award.  | No        |

### `GET /api/v1/mvp/awards`

- **Access:** Public
- **Parameters:** type?:weekly|monthly|season|all_time, playerId?:MM###, seasonId?, page, limit
- **Body:** None
- **Validation:** Enums and IDs valid; limit<=50.
- **Success:** 200 — award snapshots, score breakdown and pagination.
- **Errors:** 400 INVALID_QUERY
- **Pagination:** Standard pagination object.
- **Security:** Historical snapshots; no silent formula rewriting.

### `GET /api/v1/mvp/current`

- **Access:** Public
- **Parameters:** type:weekly|monthly|season|all_time, date?, seasonId?
- **Body:** None
- **Validation:** Season ID required for season; period normalized.
- **Success:** 200 — current award or data:null when not calculated.
- **Errors:** 400 INVALID_PERIOD
- **Pagination:** Not applicable.
- **Security:** Cached historical/current award; verified sources only.

### `GET /api/v1/mvp/configs`

- **Access:** Admin
- **Parameters:** page, limit, active?
- **Body:** None
- **Validation:** limit<=50.
- **Success:** 200 — configs and pagination.
- **Errors:** 403 FORBIDDEN
- **Pagination:** Standard pagination object.
- **Security:** Admin only; immutable historical versions.

### `POST /api/v1/mvp/configs`

- **Access:** Admin
- **Parameters:** None
- **Body:** version:string, weights:{kill,deathPenalty,placements,kdr,activity}, caps:{kdr,activity}, minimumMatches:int, notes:string
- **Validation:** Finite values; documented inputs; caps non-negative; unique version; no arbitrary unknown keys.
- **Success:** 201 — created inactive config.
- **Errors:** 400 VALIDATION_ERROR, 409 VERSION_EXISTS
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; audit; never mutate active historical config.

### `POST /api/v1/mvp/configs/{version}/activate`

- **Access:** Admin
- **Parameters:** version:string; Idempotency-Key
- **Body:** reason:string
- **Validation:** Existing inactive version; reason required.
- **Success:** 200 — active version and previous version reference.
- **Errors:** 404 CONFIG_NOT_FOUND, 409 ALREADY_ACTIVE
- **Pagination:** Not applicable.
- **Security:** CSRF token; transaction/unique partial index; audit; no automatic historical rewrite.

### `POST /api/v1/admin/mvp/recalculate`

- **Access:** Admin
- **Parameters:** Idempotency-Key
- **Body:** type, startDate?, endDate?, seasonId?, formulaVersion?, replaceCurrent?:boolean, reason:string
- **Validation:** Validated period; formula exists; replace requires explicit reason.
- **Success:** 202 — calculation accepted/result and affected award ID.
- **Errors:** 400 VALIDATION_ERROR, 409 AWARD_EXISTS, 409 CALCULATION_IN_PROGRESS
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; historical award supersession; audit.

## Ratings

| Method | Path                                         | Access | Purpose                                            | Paginated |
| ------ | -------------------------------------------- | ------ | -------------------------------------------------- | --------- |
| `GET`  | `/api/v1/players/{playerId}/ratings`         | Public | Return component and overall ratings.              | No        |
| `GET`  | `/api/v1/ratings/configs`                    | Admin  | List rating configurations.                        | Yes       |
| `POST` | `/api/v1/ratings/configs`                    | Admin  | Create an inactive documented rating formula.      | No        |
| `POST` | `/api/v1/ratings/configs/{version}/activate` | Admin  | Activate a rating formula for future calculations. | No        |
| `POST` | `/api/v1/admin/ratings/recalculate`          | Admin  | Recalculate selected ratings.                      | No        |

### `GET /api/v1/players/{playerId}/ratings`

- **Access:** Public
- **Parameters:** playerId:MM###, periodType?:all_time|weekly|monthly|season, seasonId?
- **Body:** None
- **Validation:** Valid period; season ID when needed.
- **Success:** 200 — attack, survival, consistency, activity, overall, confidence and formula version.
- **Errors:** 404 PLAYER_OR_RATING_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Persisted versioned rating; minimum-sample metadata included.

### `GET /api/v1/ratings/configs`

- **Access:** Admin
- **Parameters:** page, limit, active?
- **Body:** None
- **Validation:** limit<=50.
- **Success:** 200 — versioned config list.
- **Errors:** 403 FORBIDDEN
- **Pagination:** Standard pagination object.
- **Security:** Admin only.

### `POST /api/v1/ratings/configs`

- **Access:** Admin
- **Parameters:** None
- **Body:** version, minimumMatches, componentDefinitions, overallWeights, notes
- **Validation:** All weights finite and each required weight group totals 1; normalization bounds valid.
- **Success:** 201 — created config.
- **Errors:** 400 INVALID_WEIGHT_TOTAL, 409 VERSION_EXISTS
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; audit; version immutable.

### `POST /api/v1/ratings/configs/{version}/activate`

- **Access:** Admin
- **Parameters:** version:string
- **Body:** reason:string
- **Validation:** Config exists; reason required.
- **Success:** 200 — active config.
- **Errors:** 404 CONFIG_NOT_FOUND, 409 ALREADY_ACTIVE
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; does not rewrite historical ratings.

### `POST /api/v1/admin/ratings/recalculate`

- **Access:** Admin
- **Parameters:** Idempotency-Key
- **Body:** scope:player|period|season|all, playerId?, period?, seasonId?, formulaVersion?, reason
- **Validation:** Scope validated; formula exists.
- **Success:** 202 — accepted operation and affected scope.
- **Errors:** 400 VALIDATION_ERROR, 409 CALCULATION_IN_PROGRESS
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotent; audit; bounded batch size.

## Titles

| Method  | Path                                | Access | Purpose                                          | Paginated |
| ------- | ----------------------------------- | ------ | ------------------------------------------------ | --------- |
| `GET`   | `/api/v1/titles`                    | Public | List active dynamic-title definitions.           | Yes       |
| `GET`   | `/api/v1/titles/{code}`             | Public | Get one title definition.                        | No        |
| `POST`  | `/api/v1/titles`                    | Admin  | Create a versioned title rule.                   | No        |
| `PATCH` | `/api/v1/titles/{code}`             | Admin  | Create/update the next rule version for a title. | No        |
| `PATCH` | `/api/v1/titles/{code}/status`      | Admin  | Activate or deactivate a title definition.       | No        |
| `GET`   | `/api/v1/players/{playerId}/titles` | Public | List current and historical player titles.       | Yes       |
| `POST`  | `/api/v1/admin/titles/evaluate`     | Admin  | Evaluate title eligibility for a scope.          | No        |

### `GET /api/v1/titles`

- **Access:** Public
- **Parameters:** page, limit, active?, search?
- **Body:** None
- **Validation:** Public defaults active=true; limit<=50.
- **Success:** 200 — title definitions and pagination.
- **Errors:** 400 INVALID_QUERY
- **Pagination:** Standard pagination object.
- **Security:** Public rule descriptions only; internal admin notes excluded.

### `GET /api/v1/titles/{code}`

- **Access:** Public
- **Parameters:** code:string
- **Body:** None
- **Validation:** Upper snake/kebab code allowlist pattern.
- **Success:** 200 — title definition.
- **Errors:** 404 TITLE_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Public projection.

### `POST /api/v1/titles`

- **Access:** Admin
- **Parameters:** None
- **Body:** code,name,description,periodType,minimumMatches,priority,ruleSet,active?
- **Validation:** Unique code; structured supported metrics/operators only; priority integer.
- **Success:** 201 — created title.
- **Errors:** 400 VALIDATION_ERROR, 409 CODE_EXISTS
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; no executable user-supplied code.

### `PATCH /api/v1/titles/{code}`

- **Access:** Admin
- **Parameters:** code:string
- **Body:** name?,description?,periodType?,minimumMatches?,priority?,ruleSet?,expectedUpdatedAt?
- **Validation:** Structured rules only; optimistic concurrency.
- **Success:** 200 — updated/new version.
- **Errors:** 404 TITLE_NOT_FOUND, 409 STALE_WRITE
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; preserve award evidence version.

### `PATCH /api/v1/titles/{code}/status`

- **Access:** Admin
- **Parameters:** code:string
- **Body:** active:boolean, reason:string
- **Validation:** Reason required.
- **Success:** 200 — title status.
- **Errors:** 404 TITLE_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; current historical awards preserved.

### `GET /api/v1/players/{playerId}/titles`

- **Access:** Public
- **Parameters:** playerId:MM###, currentOnly?:boolean, page, limit
- **Body:** None
- **Validation:** Boolean and pagination validation.
- **Success:** 200 — title awards and pagination.
- **Errors:** 404 PLAYER_NOT_FOUND
- **Pagination:** Standard pagination object.
- **Security:** Public evidence summary; no private actor fields.

### `POST /api/v1/admin/titles/evaluate`

- **Access:** Admin
- **Parameters:** Idempotency-Key
- **Body:** scope:player|period|all, playerId?, period?, reason
- **Validation:** Scope inputs required; supported period only.
- **Success:** 202 — evaluation accepted/results.
- **Errors:** 400 VALIDATION_ERROR, 409 EVALUATION_IN_PROGRESS
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotent; versioned evidence; audit operational action.

## Achievements

| Method  | Path                                      | Access | Purpose                                        | Paginated |
| ------- | ----------------------------------------- | ------ | ---------------------------------------------- | --------- |
| `GET`   | `/api/v1/achievements`                    | Public | List achievement definitions.                  | Yes       |
| `GET`   | `/api/v1/achievements/{code}`             | Public | Get one achievement definition.                | No        |
| `POST`  | `/api/v1/achievements`                    | Admin  | Create an achievement rule.                    | No        |
| `PATCH` | `/api/v1/achievements/{code}`             | Admin  | Update achievement definition/rule version.    | No        |
| `PATCH` | `/api/v1/achievements/{code}/status`      | Admin  | Activate or deactivate achievement evaluation. | No        |
| `GET`   | `/api/v1/players/{playerId}/achievements` | Public | List player achievement progress and unlocks.  | Yes       |
| `POST`  | `/api/v1/admin/achievements/evaluate`     | Admin  | Re-evaluate achievements for a scope.          | No        |

### `GET /api/v1/achievements`

- **Access:** Public
- **Parameters:** page, limit, category?, active?, search?
- **Body:** None
- **Validation:** limit<=50; category allowlist.
- **Success:** 200 — definitions and pagination.
- **Errors:** 400 INVALID_QUERY
- **Pagination:** Standard pagination object.
- **Security:** Public projection.

### `GET /api/v1/achievements/{code}`

- **Access:** Public
- **Parameters:** code:string
- **Body:** None
- **Validation:** Code pattern.
- **Success:** 200 — achievement definition.
- **Errors:** 404 ACHIEVEMENT_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Public projection.

### `POST /api/v1/achievements`

- **Access:** Admin
- **Parameters:** None
- **Body:** code,name,description,icon,category,criteria,active?
- **Validation:** Unique code; structured criteria; icon must be controlled asset/key.
- **Success:** 201 — created achievement.
- **Errors:** 400 VALIDATION_ERROR, 409 CODE_EXISTS
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; no executable expressions.

### `PATCH /api/v1/achievements/{code}`

- **Access:** Admin
- **Parameters:** code:string
- **Body:** name?,description?,icon?,category?,criteria?,expectedUpdatedAt?
- **Validation:** Optimistic concurrency; structured supported metrics.
- **Success:** 200 — updated definition.
- **Errors:** 404 ACHIEVEMENT_NOT_FOUND, 409 STALE_WRITE
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; existing awards retain evidence/version.

### `PATCH /api/v1/achievements/{code}/status`

- **Access:** Admin
- **Parameters:** code:string
- **Body:** active:boolean, reason:string
- **Validation:** Reason required.
- **Success:** 200 — status.
- **Errors:** 404 ACHIEVEMENT_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; unlocked awards preserved.

### `GET /api/v1/players/{playerId}/achievements`

- **Access:** Public
- **Parameters:** playerId:MM###, status?:locked|unlocked, page, limit
- **Body:** None
- **Validation:** Status enum; limit<=100.
- **Success:** 200 — progress/unlocks and pagination.
- **Errors:** 404 PLAYER_NOT_FOUND
- **Pagination:** Standard pagination object.
- **Security:** Public safe evidence; no actor data.

### `POST /api/v1/admin/achievements/evaluate`

- **Access:** Admin
- **Parameters:** Idempotency-Key
- **Body:** scope:player|match|all, playerId?, matchId?, reason
- **Validation:** Scope IDs validated.
- **Success:** 202 — evaluation accepted and unlock summary.
- **Errors:** 400 VALIDATION_ERROR, 409 EVALUATION_IN_PROGRESS
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotent; duplicate-award unique index; notifications.

## Rivalries

| Method | Path                                   | Access | Purpose                                          | Paginated |
| ------ | -------------------------------------- | ------ | ------------------------------------------------ | --------- |
| `GET`  | `/api/v1/rivalries`                    | Public | Get head-to-head comparison between two players. | No        |
| `GET`  | `/api/v1/players/{playerId}/rivalries` | Public | List a player’s strongest rivalries.             | Yes       |
| `GET`  | `/api/v1/rivalries/weekly`             | Public | Return rival of the week.                        | No        |

### `GET /api/v1/rivalries`

- **Access:** Public
- **Parameters:** playerA:MM###, playerB:MM###, periodType?:all_time|weekly|monthly|season, seasonId?
- **Body:** None
- **Validation:** Distinct players; period valid.
- **Success:** 200 — shared matches, wins, draws, kills, comparative KDR and tie-break rule.
- **Errors:** 400 SAME_PLAYER_OR_INVALID_PERIOD, 404 PLAYER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Verified shared matches only; cached canonical pair.

### `GET /api/v1/players/{playerId}/rivalries`

- **Access:** Public
- **Parameters:** playerId:MM###, periodType?, page, limit, sortBy?
- **Body:** None
- **Validation:** limit<=50; sort allowlist.
- **Success:** 200 — rival summaries and pagination.
- **Errors:** 404 PLAYER_NOT_FOUND
- **Pagination:** Standard pagination object.
- **Security:** Verified/cached data only.

### `GET /api/v1/rivalries/weekly`

- **Access:** Public
- **Parameters:** weekStart?:date
- **Body:** None
- **Validation:** Week normalized to league timezone.
- **Success:** 200 — winning rivalry snapshot or data:null.
- **Errors:** 400 INVALID_WEEK
- **Pagination:** Not applicable.
- **Security:** Verified weekly data; deterministic definition.

## Challenges

| Method  | Path                                          | Access                                                       | Purpose                                    | Paginated |
| ------- | --------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------ | --------- |
| `GET`   | `/api/v1/challenges`                          | Public                                                       | List active or archived league challenges. | Yes       |
| `GET`   | `/api/v1/challenges/{code}`                   | Public if published; Admin for draft                         | Get challenge details.                     | No        |
| `POST`  | `/api/v1/challenges`                          | Admin                                                        | Create a challenge.                        | No        |
| `PATCH` | `/api/v1/challenges/{code}`                   | Admin                                                        | Update a draft/upcoming challenge.         | No        |
| `PATCH` | `/api/v1/challenges/{code}/status`            | Admin                                                        | Transition challenge lifecycle.            | No        |
| `GET`   | `/api/v1/players/{playerId}/challenges`       | Player owner, Admin; public only completed badges if enabled | List challenge progress.                   | Yes       |
| `POST`  | `/api/v1/admin/challenges/{code}/recalculate` | Admin                                                        | Rebuild challenge progress.                | No        |

### `GET /api/v1/challenges`

- **Access:** Public
- **Parameters:** type?:weekly|monthly, status?, page, limit
- **Body:** None
- **Validation:** Enums; public excludes drafts.
- **Success:** 200 — challenge definitions and pagination.
- **Errors:** 400 INVALID_QUERY
- **Pagination:** Standard pagination object.
- **Security:** Public safe fields; draft visibility admin only.

### `GET /api/v1/challenges/{code}`

- **Access:** Public if published; Admin for draft
- **Parameters:** code:string
- **Body:** None
- **Validation:** Code pattern and role-based visibility.
- **Success:** 200 — challenge definition.
- **Errors:** 403 NOT_PUBLISHED, 404 CHALLENGE_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Public projection.

### `POST /api/v1/challenges`

- **Access:** Admin
- **Parameters:** None
- **Body:** code,name,description,type,startDate,endDate,targetMetric,targetValue,reward,minimumEligibility,status
- **Validation:** Unique code; valid date range; supported metric; positive finite target.
- **Success:** 201 — created challenge.
- **Errors:** 400 VALIDATION_ERROR, 409 CODE_EXISTS, 409 DATE_OVERLAP_POLICY
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; no executable criteria.

### `PATCH /api/v1/challenges/{code}`

- **Access:** Admin
- **Parameters:** code:string
- **Body:** editable fields, expectedUpdatedAt
- **Validation:** Cannot change core target after active unless versioned replacement; optimistic concurrency.
- **Success:** 200 — updated challenge.
- **Errors:** 404 CHALLENGE_NOT_FOUND, 409 ACTIVE_CHALLENGE_IMMUTABLE, 409 STALE_WRITE
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; preserve historical progress.

### `PATCH /api/v1/challenges/{code}/status`

- **Access:** Admin
- **Parameters:** code:string
- **Body:** status:draft|upcoming|active|completed|archived, reason:string
- **Validation:** Valid state transition; dates compatible.
- **Success:** 200 — new status.
- **Errors:** 400 INVALID_TRANSITION, 404 CHALLENGE_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; completion freezes historical snapshot.

### `GET /api/v1/players/{playerId}/challenges`

- **Access:** Player owner, Admin; public only completed badges if enabled
- **Parameters:** playerId:MM###, status?, page, limit
- **Body:** None
- **Validation:** Owner resolved from linked player unless admin; pagination.
- **Success:** 200 — progress and pagination.
- **Errors:** 403 NOT_OWNER, 404 PLAYER_NOT_FOUND
- **Pagination:** Standard pagination object.
- **Security:** Ownership enforcement in backend; no private progress leakage.

### `POST /api/v1/admin/challenges/{code}/recalculate`

- **Access:** Admin
- **Parameters:** code:string; Idempotency-Key
- **Body:** scope:all|player, playerId?, reason
- **Validation:** Challenge exists; scope valid.
- **Success:** 202 — accepted recalculation.
- **Errors:** 404 CHALLENGE_NOT_FOUND, 409 RECALCULATION_IN_PROGRESS
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotent; audit; duplicate completion prevention.

## Hall of Fame

| Method | Path                                     | Access | Purpose                                                 | Paginated |
| ------ | ---------------------------------------- | ------ | ------------------------------------------------------- | --------- |
| `GET`  | `/api/v1/hall-of-fame`                   | Public | List Hall of Fame records.                              | Yes       |
| `GET`  | `/api/v1/hall-of-fame/{category}`        | Public | Get records for one Hall of Fame category.              | No        |
| `POST` | `/api/v1/admin/hall-of-fame/recalculate` | Admin  | Evaluate and supersede Hall of Fame records explicitly. | No        |

### `GET /api/v1/hall-of-fame`

- **Access:** Public
- **Parameters:** category?, seasonId?, currentOnly?, page, limit
- **Body:** None
- **Validation:** Category enum; limit<=100.
- **Success:** 200 — immutable record snapshots and pagination.
- **Errors:** 400 INVALID_QUERY
- **Pagination:** Standard pagination object.
- **Security:** Public evidence summary; historical snapshots.

### `GET /api/v1/hall-of-fame/{category}`

- **Access:** Public
- **Parameters:** category:enum, seasonId?
- **Body:** None
- **Validation:** Supported category only.
- **Success:** 200 — current and historical records.
- **Errors:** 400 INVALID_CATEGORY
- **Pagination:** Not applicable.
- **Security:** Cached immutable snapshots.

### `POST /api/v1/admin/hall-of-fame/recalculate`

- **Access:** Admin
- **Parameters:** Idempotency-Key
- **Body:** category?:enum, seasonId?, reason:string
- **Validation:** Reason required; source/formula version resolved.
- **Success:** 202 — evaluated records and supersession summary.
- **Errors:** 400 VALIDATION_ERROR, 409 CALCULATION_IN_PROGRESS
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotent; audit; never overwrite historical record.

## Seasons

| Method  | Path                                 | Access              | Purpose                                 | Paginated |
| ------- | ------------------------------------ | ------------------- | --------------------------------------- | --------- |
| `GET`   | `/api/v1/seasons`                    | Public              | List seasons.                           | Yes       |
| `POST`  | `/api/v1/seasons`                    | Admin               | Create a season.                        | No        |
| `GET`   | `/api/v1/seasons/{slug}`             | Public if published | Get season detail and summary.          | No        |
| `PATCH` | `/api/v1/seasons/{slug}`             | Admin               | Update draft/upcoming season metadata.  | No        |
| `POST`  | `/api/v1/seasons/{slug}/activate`    | Admin               | Activate a season.                      | No        |
| `POST`  | `/api/v1/seasons/{slug}/complete`    | Admin               | Complete a season and freeze snapshots. | No        |
| `POST`  | `/api/v1/seasons/{slug}/archive`     | Admin               | Archive a completed season.             | No        |
| `GET`   | `/api/v1/seasons/{slug}/leaderboard` | Public              | Return season leaderboard.              | Yes       |
| `GET`   | `/api/v1/seasons/{slug}/statistics`  | Public              | Return season aggregate statistics.     | No        |

### `GET /api/v1/seasons`

- **Access:** Public
- **Parameters:** status?, page, limit, sortOrder
- **Body:** None
- **Validation:** Public excludes draft unless admin; limit<=50.
- **Success:** 200 — seasons and pagination.
- **Errors:** 400 INVALID_QUERY
- **Pagination:** Standard pagination object.
- **Security:** Public projection.

### `POST /api/v1/seasons`

- **Access:** Admin
- **Parameters:** None
- **Body:** name,slug,description,startDate,endDate,status?:draft|upcoming
- **Validation:** Unique slug; end>start; overlap policy; cannot create active directly without activation workflow.
- **Success:** 201 — created season.
- **Errors:** 400 VALIDATION_ERROR, 409 SLUG_EXISTS, 409 SEASON_OVERLAP
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; UTC storage with league-timezone interpretation.

### `GET /api/v1/seasons/{slug}`

- **Access:** Public if published
- **Parameters:** slug:string
- **Body:** None
- **Validation:** Slug format.
- **Success:** 200 — season, champion/MVP snapshots if completed.
- **Errors:** 404 SEASON_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Public projection.

### `PATCH /api/v1/seasons/{slug}`

- **Access:** Admin
- **Parameters:** slug:string
- **Body:** name?,description?,startDate?,endDate?, expectedUpdatedAt?
- **Validation:** No invalid overlap; active/completed critical fields immutable through this route.
- **Success:** 200 — updated season.
- **Errors:** 409 SEASON_IMMUTABLE, 409 SEASON_OVERLAP, 409 STALE_WRITE
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit.

### `POST /api/v1/seasons/{slug}/activate`

- **Access:** Admin
- **Parameters:** slug:string; Idempotency-Key
- **Body:** reason:string
- **Validation:** Season upcoming/draft; no other active season; current date policy explicit.
- **Success:** 200 — active season.
- **Errors:** 409 ACTIVE_SEASON_EXISTS, 409 INVALID_TRANSITION
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotent transaction; audit; notifications.

### `POST /api/v1/seasons/{slug}/complete`

- **Access:** Admin
- **Parameters:** slug:string; Idempotency-Key
- **Body:** reason:string
- **Validation:** Season active; end boundary reached or explicit override; required statistics complete.
- **Success:** 200 — completed season with champion/MVP snapshot references.
- **Errors:** 409 INVALID_TRANSITION, 409 ANALYTICS_NOT_READY
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; transaction; audit; notifications; Hall of Fame evaluation.

### `POST /api/v1/seasons/{slug}/archive`

- **Access:** Admin
- **Parameters:** slug:string
- **Body:** reason:string
- **Validation:** Completed only.
- **Success:** 200 — archived season.
- **Errors:** 409 INVALID_TRANSITION
- **Pagination:** Not applicable.
- **Security:** CSRF token; audit; historical data retained.

### `GET /api/v1/seasons/{slug}/leaderboard`

- **Access:** Public
- **Parameters:** slug:string, metric, page, limit
- **Body:** None
- **Validation:** Metric allowlist; season exists.
- **Success:** 200 — ranked season entries and pagination.
- **Errors:** 400 INVALID_METRIC, 404 SEASON_NOT_FOUND
- **Pagination:** Standard pagination object.
- **Security:** Verified season matches only; snapshot/version included.

### `GET /api/v1/seasons/{slug}/statistics`

- **Access:** Public
- **Parameters:** slug:string
- **Body:** None
- **Validation:** Season exists.
- **Success:** 200 — season totals, records and source version.
- **Errors:** 404 SEASON_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Verified/cached data only.

## Notifications

| Method  | Path                                          | Access        | Purpose                                   | Paginated |
| ------- | --------------------------------------------- | ------------- | ----------------------------------------- | --------- |
| `GET`   | `/api/v1/notifications`                       | Authenticated | List current user notifications.          | Yes       |
| `GET`   | `/api/v1/notifications/unread-count`          | Authenticated | Return unread notification count.         | No        |
| `PATCH` | `/api/v1/notifications/{notificationId}/read` | Authenticated | Mark one owned notification read/unread.  | No        |
| `PATCH` | `/api/v1/notifications/read-all`              | Authenticated | Mark all current-user notifications read. | No        |
| `GET`   | `/api/v1/admin/notifications`                 | Admin         | Search all notification records.          | Yes       |
| `POST`  | `/api/v1/admin/notifications`                 | Admin         | Create a controlled system notification.  | No        |

### `GET /api/v1/notifications`

- **Access:** Authenticated
- **Parameters:** page, limit, read?, type?
- **Body:** None
- **Validation:** limit<=100; type enum.
- **Success:** 200 — notifications and pagination.
- **Errors:** 401 UNAUTHENTICATED
- **Pagination:** Standard pagination object.
- **Security:** User ID always from session; client cannot query another user.

### `GET /api/v1/notifications/unread-count`

- **Access:** Authenticated
- **Parameters:** None
- **Body:** None
- **Validation:** No input.
- **Success:** 200 — unreadCount.
- **Errors:** 401 UNAUTHENTICATED
- **Pagination:** Not applicable.
- **Security:** Session-owned query.

### `PATCH /api/v1/notifications/{notificationId}/read`

- **Access:** Authenticated
- **Parameters:** notificationId:ObjectId
- **Body:** read?:boolean default true
- **Validation:** Notification must belong to session user.
- **Success:** 200 — updated notification.
- **Errors:** 403 NOT_OWNER, 404 NOTIFICATION_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; ownership check.

### `PATCH /api/v1/notifications/read-all`

- **Access:** Authenticated
- **Parameters:** None
- **Body:** before?:datetime
- **Validation:** Optional before date valid.
- **Success:** 200 — modifiedCount.
- **Errors:** 401 UNAUTHENTICATED
- **Pagination:** Not applicable.
- **Security:** CSRF token; session user only.

### `GET /api/v1/admin/notifications`

- **Access:** Admin
- **Parameters:** page, limit, userId?, type?, read?, from?, to?
- **Body:** None
- **Validation:** Validated filters; limit<=100.
- **Success:** 200 — notifications and pagination.
- **Errors:** 403 FORBIDDEN
- **Pagination:** Standard pagination object.
- **Security:** Admin-only; avoid exposing unrelated user private data.

### `POST /api/v1/admin/notifications`

- **Access:** Admin
- **Parameters:** None
- **Body:** targetUserIds:string[], type, title, message, relatedEntity?:{type,id}
- **Validation:** 1–100 targets; type allowlist; title/message length limits; no arbitrary HTML.
- **Success:** 201 — createdCount and notification IDs.
- **Errors:** 400 VALIDATION_ERROR, 404 TARGET_USER_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** CSRF token; rate limit; sanitize content; audit if sensitive broadcast.

## AI Summaries

| Method | Path                                                | Access                         | Purpose                                       | Paginated |
| ------ | --------------------------------------------------- | ------------------------------ | --------------------------------------------- | --------- |
| `GET`  | `/api/v1/ai-summaries`                              | Public where context is public | Get cached AI or deterministic summaries.     | No        |
| `POST` | `/api/v1/admin/ai-summaries/generate`               | Admin                          | Generate a summary for a verified data range. | No        |
| `POST` | `/api/v1/admin/ai-summaries/{summaryId}/regenerate` | Admin                          | Regenerate a cached summary explicitly.       | No        |

### `GET /api/v1/ai-summaries`

- **Access:** Public where context is public
- **Parameters:** type:weekly|monthly|player_performance|match_insight|highlight, startDate?, endDate?, playerId?, matchId?
- **Body:** None
- **Validation:** Context-specific identifiers; public source must be verified.
- **Success:** 200 — content, generatedBy=ai|fallback, generation date, source range and warning label.
- **Errors:** 400 INVALID_CONTEXT, 404 SUMMARY_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Verified structured data only; cached; no sensitive user data.

### `POST /api/v1/admin/ai-summaries/generate`

- **Access:** Admin
- **Parameters:** Idempotency-Key
- **Body:** type, startDate?, endDate?, playerId?, matchId?, forceFallback?:boolean, reason?:string
- **Validation:** Context verified; date range bounded; source hash generated server-side.
- **Success:** 202 — generated/cached summary or accepted job.
- **Errors:** 400 INVALID_CONTEXT, 409 SUMMARY_ALREADY_EXISTS, 429 AI_BUDGET_LIMIT, 503 AI_PROVIDER_UNAVAILABLE
- **Pagination:** Not applicable.
- **Security:** CSRF token; idempotent; prompt/output validation; deterministic fallback; AI cannot modify stats.

### `POST /api/v1/admin/ai-summaries/{summaryId}/regenerate`

- **Access:** Admin
- **Parameters:** summaryId:ObjectId; Idempotency-Key
- **Body:** reason:string, provider?:configured-provider
- **Validation:** Reason required; source range still valid/verified.
- **Success:** 202 — superseding summary result.
- **Errors:** 404 SUMMARY_NOT_FOUND, 429 AI_BUDGET_LIMIT
- **Pagination:** Not applicable.
- **Security:** CSRF token; preserve prior summary; audit/generation metadata.

## Dashboard

| Method | Path                                | Access           | Purpose                                           | Paginated |
| ------ | ----------------------------------- | ---------------- | ------------------------------------------------- | --------- |
| `GET`  | `/api/v1/admin/dashboard/overview`  | Admin            | Return admin KPI overview.                        | No        |
| `GET`  | `/api/v1/admin/dashboard/activity`  | Admin            | Return recent sensitive and operational activity. | No        |
| `GET`  | `/api/v1/moderator/dashboard/queue` | Moderator, Admin | Return OCR review work queue.                     | Yes       |

### `GET /api/v1/admin/dashboard/overview`

- **Access:** Admin
- **Parameters:** period?:7d|30d|current_month
- **Body:** None
- **Validation:** Period enum.
- **Success:** 200 — total/active players, verified/pending/failed matches, weekly/monthly volume, current MVP, active season.
- **Errors:** 403 FORBIDDEN
- **Pagination:** Not applicable.
- **Security:** Admin-only; cached aggregates; no raw secrets.

### `GET /api/v1/admin/dashboard/activity`

- **Access:** Admin
- **Parameters:** limit?:1-50
- **Body:** None
- **Validation:** limit<=50.
- **Success:** 200 — recent uploads, verifications, failures and safe audit summaries.
- **Errors:** 403 FORBIDDEN
- **Pagination:** Not applicable.
- **Security:** Admin-only; redact IP where not needed.

### `GET /api/v1/moderator/dashboard/queue`

- **Access:** Moderator, Admin
- **Parameters:** page, limit, status?:processing|extracted|needs_review|processing_failed, sortBy
- **Body:** None
- **Validation:** Status allowlist; limit<=50.
- **Success:** 200 — queue metrics, jobs and pagination.
- **Errors:** 403 FORBIDDEN
- **Pagination:** Standard pagination object.
- **Security:** Protected; signed screenshot thumbnails; no provider credentials.

## Audit Logs

| Method | Path                                                  | Access | Purpose                           | Paginated |
| ------ | ----------------------------------------------------- | ------ | --------------------------------- | --------- |
| `GET`  | `/api/v1/audit-logs`                                  | Admin  | Search append-only audit records. | Yes       |
| `GET`  | `/api/v1/audit-logs/{auditLogId}`                     | Admin  | Get one sanitized audit record.   | No        |
| `GET`  | `/api/v1/audit-logs/entities/{entityType}/{entityId}` | Admin  | Get one entity’s audit timeline.  | Yes       |

### `GET /api/v1/audit-logs`

- **Access:** Admin
- **Parameters:** page, limit, actorUserId?, action?, entityType?, entityId?, from?, to?, sortOrder
- **Body:** None
- **Validation:** Action allowlist; date range max 366 days; limit<=100.
- **Success:** 200 — sanitized audit logs and pagination.
- **Errors:** 400 INVALID_QUERY, 403 FORBIDDEN
- **Pagination:** Standard pagination object.
- **Security:** Fresh admin session; sensitive value redaction; no password/token fields.

### `GET /api/v1/audit-logs/{auditLogId}`

- **Access:** Admin
- **Parameters:** auditLogId:ObjectId
- **Body:** None
- **Validation:** Valid ObjectId.
- **Success:** 200 — audit record with sanitized before/after.
- **Errors:** 403 FORBIDDEN, 404 AUDIT_LOG_NOT_FOUND
- **Pagination:** Not applicable.
- **Security:** Fresh admin session; field-level redaction.

### `GET /api/v1/audit-logs/entities/{entityType}/{entityId}`

- **Access:** Admin
- **Parameters:** entityType:string, entityId:string, page, limit
- **Body:** None
- **Validation:** Entity type allowlist; limit<=100.
- **Success:** 200 — ordered entity audit timeline and pagination.
- **Errors:** 400 INVALID_ENTITY_TYPE, 403 FORBIDDEN
- **Pagination:** Standard pagination object.
- **Security:** Fresh admin session; sanitized snapshots.

## League Config

| Method  | Path                    | Access | Purpose                                                     | Paginated |
| ------- | ----------------------- | ------ | ----------------------------------------------------------- | --------- |
| `GET`   | `/api/v1/league-config` | Public | Return public league settings.                              | No        |
| `PATCH` | `/api/v1/league-config` | Admin  | Update league timezone/branding and calculation boundaries. | No        |

### `GET /api/v1/league-config`

- **Access:** Public
- **Parameters:** None
- **Body:** None
- **Validation:** No input.
- **Success:** 200 — name, branding, timezone, weekStart and public minimum-match rules.
- **Errors:** 404 CONFIG_NOT_INITIALIZED
- **Pagination:** Not applicable.
- **Security:** Public projection excludes provider keys and internal settings.

### `PATCH /api/v1/league-config`

- **Access:** Admin
- **Parameters:** None
- **Body:** name?, branding?, timezone?, weekStartsOn?, minimumMatchRules?, expectedUpdatedAt?, reason:string
- **Validation:** Valid IANA timezone; weekStartsOn 0–6; supported keys; reason required; optimistic concurrency.
- **Success:** 200 — updated public/admin config.
- **Errors:** 400 INVALID_TIMEZONE_OR_RULE, 409 STALE_WRITE
- **Pagination:** Not applicable.
- **Security:** CSRF token; fresh admin session; audit; changes do not silently rewrite historical periods.

## State transitions

```text
uploaded -> processing -> extracted -> needs_review -> verified
                         \-> processing_failed -> processing (retry)
extracted/needs_review -> rejected
verified -> correction revision -> verified (new revision)
```

Direct client updates to `status`, `official`, statistics, ranks, formula versions or audit fields are forbidden.

## Error code groups

- `400`: malformed input, invalid query, invalid state proposal.
- `401`: no valid session.
- `403`: authenticated but insufficient permission/ownership.
- `404`: resource not found or intentionally hidden.
- `409`: state conflict, duplicate, idempotency/revision conflict.
- `413/415`: invalid upload size/type.
- `422`: semantically invalid correction/calculation input.
- `429`: rate, retry, rendering or budget limit.
- `502/503`: storage/provider/service failure without claiming completion.

## Phase 4 implementation boundaries

- Controllers only parse validated inputs and call services.
- Services enforce state transitions, transactions, calculations, idempotency and audits.
- Better Auth handler is mounted before `express.json()`.
- Route modules will be grouped by the domains in this document.
- OpenAPI and `endpoint-catalog.json` are the implementation source contracts.
