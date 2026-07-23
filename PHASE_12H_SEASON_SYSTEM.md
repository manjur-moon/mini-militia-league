# Phase 12H — Season System

## Scope

This module adds controlled league seasons without changing the verified-match source-of-truth rule.

Implemented lifecycle:

```text
draft → upcoming → active → completed → archived
```

A season cannot be moved backwards after activation, and an archived season is terminal. Only one active season can exist because MongoDB enforces a partial unique index on `status: "active"`.

## Implemented features

- Create and edit draft/upcoming seasons
- Draft, upcoming, active, completed and archived states
- Overlapping scheduled-season prevention
- Active-season uniqueness
- League timezone per season
- Public season list, active season and archive
- Season detail, statistics and leaderboard
- Automatic match-to-season resolution from the official match date
- Optional moderator/admin season selection, validated again by the server
- Match-assignment backfill for existing data
- Season champion and season MVP finalization
- Final leaderboard/statistics snapshot
- Hall of Fame season-champion synchronization
- Season-started and season-completed notifications
- Audit logs for create, update, lifecycle, recalculation and backfill actions
- Responsive public and admin interfaces

## Data integrity rules

1. Database dates remain UTC; each season stores the timezone used for league boundaries.
2. Draft seasons are never returned from public endpoints.
3. Draft and archived seasons cannot receive new match assignments.
4. A requested season must contain the official match date.
5. If no season is requested, the server resolves the unique eligible season by match date.
6. Verified-match corrections revalidate and update the official season reference.
7. A completed season must finish finalization before it can be archived.
8. Finalized champion/MVP/statistics data is stored as a historical snapshot.
9. A unique partial index prevents two active seasons even during concurrent requests.
10. All admin mutations require a reason and create an audit record.

## Public API

```text
GET /api/v1/seasons
GET /api/v1/seasons/active
GET /api/v1/seasons/:identifier
GET /api/v1/seasons/:identifier/statistics
GET /api/v1/seasons/:identifier/leaderboard
```

`identifier` accepts a MongoDB ID or a lowercase season slug.

## Admin API

```text
GET   /api/v1/admin/seasons
POST  /api/v1/admin/seasons
PATCH /api/v1/admin/seasons/:seasonId
POST  /api/v1/admin/seasons/:seasonId/status
POST  /api/v1/admin/seasons/:seasonId/recalculate
POST  /api/v1/admin/seasons/:seasonId/backfill-matches
```

All admin endpoints require an authenticated active admin account.

## Main files

```text
server/src/models/season.model.js
server/src/validators/season.validation.js
server/src/services/season.service.js
server/src/controllers/season.controller.js
server/src/routes/season.routes.js
server/src/routes/admin-season.routes.js
server/src/scripts/migrate-season-indexes.js

client/src/services/season.service.js
client/src/features/seasons/components/season-card.jsx
client/src/features/seasons/components/season-status-badge.jsx
client/src/pages/seasons.page.jsx
client/src/pages/season-detail.page.jsx
client/src/pages/admin-seasons.page.jsx

docs/phase-12h-seasons.openapi.yaml
```

## MongoDB Atlas setup

The project already uses Atlas-compatible transactions and indexes. After deploying this version, run the season index synchronization once:

```bash
npm run seasons:migrate-indexes
```

This creates/synchronizes:

- unique slug index
- date-range indexes
- status/date indexes
- champion lookup index
- partial unique active-season index

Run the migration while no competing deployment is modifying season indexes.

## Season finalization

Changing an active season to `completed` performs a controlled finalization:

1. Persist completed state and processing metadata.
2. Recalculate season periodic statistics.
3. Rebuild the season leaderboard.
4. Recalculate the season MVP using the active versioned formula.
5. Calculate the season champion.
6. Synchronize the Hall of Fame season-champion record.
7. Store champion, MVP, leaderboard/statistics evidence and finalization version.
8. Mark finalization completed or preserve a failure code for retry.

Recalculation is explicit. Historical snapshots are not silently rewritten by formula changes.

## Match assignment

At upload/review/verification/correction time, season assignment is resolved server-side:

```text
explicit season ID + official match date
                 or
unique eligible season containing the official match date
```

A mismatch returns a conflict instead of trusting the client. Existing matches can be assigned with the admin backfill endpoint.

## Frontend routes

```text
/seasons
/seasons/:identifier
/admin/seasons
```

## Commands

```bash
npm install
npm run seasons:migrate-indexes
npm run lint
npm run test -w server
npm run test -w client
npm run build
npm run dev
```

## Tests

Season coverage includes:

- model validation and status-dependent timestamps
- overlapping and adjacent date ranges
- allowed and rejected lifecycle transitions
- inferred date-boundary states
- request validation
- public status restrictions
- season card and status badge rendering

## Deployment note

MongoDB Atlas satisfies the replica-set requirement used by match verification, verified corrections, MVP recalculation and season finalization transactions.
