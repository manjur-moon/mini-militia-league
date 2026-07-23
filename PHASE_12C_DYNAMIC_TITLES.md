# Phase 12C — Dynamic Titles System

## Module scope

This module adds temporary, rule-driven player titles calculated exclusively from verified periodic statistics.

Implemented titles:

| Code              | Name            |  Period | Minimum matches | Priority | Initial eligibility                            |
| ----------------- | --------------- | ------: | --------------: | -------: | ---------------------------------------------- |
| `KING_SLAYER`     | King Slayer     |  Weekly |               5 |      100 | First places ≥ 3 and win rate ≥ 40%            |
| `TERMINATOR`      | Terminator      |  Weekly |               5 |       90 | Total kills ≥ 100 and average kills ≥ 15       |
| `ON_FIRE`         | On Fire         |  Weekly |               4 |       85 | First places ≥ 2 and win rate ≥ 50%            |
| `SHARP_SHOOTER`   | Sharp Shooter   |  Weekly |               5 |       80 | KDR ≥ 2 and average kills ≥ 15                 |
| `SURVIVOR`        | Survivor        |  Weekly |               5 |       75 | Average deaths ≤ 18 and average rank ≤ 2.5     |
| `RISING_STAR`     | Rising Star     | Monthly |               5 |       70 | Improvement rate ≥ 20% over the previous month |
| `DEATH_MAGNET`    | Death Magnet    |  Weekly |               5 |       30 | Average deaths ≥ 30                            |
| `UNLUCKY_SOLDIER` | Unlucky Soldier |  Weekly |               5 |       20 | Last-place count ≥ 3                           |

All formulas are admin-versioned. The table documents only the bootstrap `v1` rules.

## Core rules

- Only verified `PeriodicStatistics` data is evaluated.
- Minimum-match validation runs before rule evaluation.
- Rule sets support `all` and `any` combinators.
- Supported operators are `eq`, `gte`, `lte`, `gt` and `lt`.
- Every award stores a complete title snapshot and rule evidence.
- A player may qualify for several titles in one period, but only the highest-priority non-expired award becomes current.
- Temporary awards expire at the earlier of the configured duration or calculation-period end.
- Recalculation revokes awards that no longer qualify after verified-match correction.
- Historical awards retain the original code, version, description, priority, evidence and period.
- Definition changes create an immutable revision instead of rewriting historical rules.

## API routes

### Public

```text
GET /api/v1/titles
GET /api/v1/titles/definitions/:code
GET /api/v1/titles/players/:playerId/current
GET /api/v1/titles/players/:playerId/history
```

### Admin

```text
GET  /api/v1/titles/admin/definitions
POST /api/v1/titles/admin/definitions
POST /api/v1/titles/admin/definitions/:titleId/revisions
POST /api/v1/titles/admin/definitions/:titleId/activate
POST /api/v1/titles/admin/definitions/:titleId/deactivate
POST /api/v1/admin/titles/recalculate
```

## Frontend routes

```text
/titles
/admin/titles
```

The public player profile also displays the current title and paginated title history. Player cards use the immutable award snapshot and fall back to `League Competitor` when no current title exists.

## Main files

```text
server/src/models/dynamic-title.model.js
server/src/models/player-title.model.js
server/src/services/title-rule.service.js
server/src/services/title.service.js
server/src/controllers/title.controller.js
server/src/validators/title.validation.js
server/src/routes/title.routes.js
server/src/routes/admin-title.routes.js
client/src/services/title.service.js
client/src/features/titles/components/title-badge.jsx
client/src/features/titles/components/player-title-panel.jsx
client/src/pages/titles.page.jsx
client/src/pages/admin-titles.page.jsx
```

## Admin workflow

1. Create a new inactive definition or immutable revision.
2. Review period, minimum matches, priority and rules.
3. Activate the reviewed version. The prior active version with the same code is deactivated transactionally.
4. Run title recalculation after verified analytics changes.
5. Review player profiles and generated `title_earned` notifications.

Example recalculation body:

```json
{
  "reason": "Recalculate current title eligibility after verified match updates."
}
```

A targeted evaluation may include `date`, `seasonId` and selected `codes`.

## Data integrity and security

- Admin authorization is enforced by backend middleware.
- All mutation bodies and query parameters use strict Zod schemas.
- Definition creation, revision, activation, deactivation and recalculation are audited.
- Only one active version per title code is allowed.
- Only one current title per player is allowed through a partial unique index.
- Deactivating a definition revokes its current awards.
- Formula changes never silently rewrite historical award snapshots.
- Recalculation and activation use MongoDB transactions.

## Existing-database index migration

Fresh databases create the correct versioned indexes automatically. A database created from the earlier Phase 2 model may still have the old unique `code_1` index on `dynamicTitles`. Drop it once before synchronizing the new indexes:

```javascript
db.dynamicTitles.dropIndex("code_1");
```

Then allow the application deployment process to create:

```text
{ code: 1, version: 1 } unique
{ code: 1, isActive: 1 } unique where isActive=true
```

Back up production data before any manual index operation.

## Run and verify

```bash
npm install
npm run check
npm run dev
```

No new environment variable or dependency is required.

## Automated coverage

- Rule combinators and operators
- Minimum sample protection
- Deterministic priority selection
- Temporary expiration calculation
- Default definition validation
- Historical award snapshot validation
- Strict request validation
- Client title badge rendering

## Common mistakes

- Mutating an active definition instead of creating a revision
- Assigning titles from unverified OCR output
- Ignoring minimum-match requirements
- Allowing multiple current titles for one player
- Replacing award snapshots with the latest definition text
- Forgetting recalculation after verified-match corrections
- Treating a temporary title as a permanent player property
