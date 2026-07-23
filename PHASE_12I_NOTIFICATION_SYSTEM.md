# Phase 12I — Notification System

## Included

- Authenticated notification inbox for player, moderator and admin dashboards
- Read/unread state and `readAt` timestamp
- Unread-count endpoint and header badge with conservative polling
- Server-side pagination, type filtering and read-status filtering
- Mark one notification as read
- Mark all notifications as read
- Related-entity metadata and validated internal action URLs
- Admin delivery log with search, read/source filters and recipient details
- Auditable admin-created announcements targeted by user ID or exact email
- Idempotent system delivery through optional `deduplicationKey`
- Automatic notification delivery for:
  - achievement unlocked
  - MVP award
  - challenge completed
  - dynamic title earned
  - match verified
  - match rejected
  - player account linked
  - season started
  - season completed
- Notification model, validation, routing and UI tests

## API routes

```text
GET   /api/v1/notifications
GET   /api/v1/notifications/unread-count
PATCH /api/v1/notifications/:notificationId/read
PATCH /api/v1/notifications/read-all

GET   /api/v1/admin/notifications
POST  /api/v1/admin/notifications
```

All user routes require an active Better Auth session. Admin routes additionally require the `admin` role. Ownership is always checked in the database when a notification is marked as read.

## Response examples

### Notification list

```json
{
  "success": true,
  "message": "Notifications retrieved successfully.",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 0,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "meta": {
    "unreadCount": 0
  }
}
```

### Unread count

```json
{
  "success": true,
  "message": "Unread notification count retrieved successfully.",
  "data": {
    "unreadCount": 3
  }
}
```

## Data-integrity decisions

- `userId` references the Better Auth user ID as a string.
- Notification ownership is never accepted from the client.
- External URLs and protocol-relative URLs are rejected; `actionUrl` must be an internal path such as `/matches/abc`.
- System event delivery can use a unique partial `deduplicationKey` to prevent duplicate notifications during retries or recalculation.
- Notifications are not automatically deleted, preserving user activity history.
- Admin-created announcements are stored with `source: "admin"`, `createdBy` and an append-only audit record.
- Read status changes do not alter official match, ranking, award or analytics data.

## MongoDB Atlas index migration

Run once after deploying this phase:

```bash
npm run notifications:migrate-indexes
```

Indexes created:

```text
userId + isRead + createdAt
userId + type + createdAt
createdAt + type
deduplicationKey (unique partial index)
```

## Run and verify

```bash
npm install
npm run notifications:migrate-indexes
npm run check
npm run dev
```

## Security notes

- All inbox endpoints require a valid active session.
- Admin delivery endpoints use backend role authorization.
- Mark-as-read queries include both `_id` and authenticated `userId`.
- Manual notifications can only target active accounts.
- Admin action URLs are validated as internal paths to prevent open redirects.
- Request bodies and query parameters are validated with Zod.
- Admin delivery creates an audit log without storing secrets or session data.

## Common mistakes

- Do not expose a route that accepts `userId` for read-state changes.
- Do not trust a frontend unread count as authoritative.
- Do not use external notification action URLs without an allowlist.
- Do not send duplicate event notifications from retryable jobs without an idempotency key.
- Do not poll unread counts every few seconds on free hosting; this build uses a 60-second interval while the page is active.
