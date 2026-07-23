# Phase 12F — Challenges System

## Scope

This module adds versioned weekly and monthly challenges powered only by verified match statistics. It preserves challenge definitions, player progress, completion evidence and rewards as historical snapshots.

## Default challenges

| Code prefix              | Period  |                Target | Minimum sample |
| ------------------------ | ------- | --------------------: | -------------: |
| `WEEKLY_KILLS_100`       | Weekly  |     Total kills ≥ 100 |        1 match |
| `WEEKLY_FIRST_PLACE_10`  | Weekly  |     First places ≥ 10 |     10 matches |
| `WEEKLY_KDR_2`           | Weekly  |             KDR > 2.0 |      3 matches |
| `MONTHLY_KILLS_500`      | Monthly |     Total kills ≥ 500 |        1 match |
| `MONTHLY_FIRST_PLACE_25` | Monthly |     First places ≥ 25 |     25 matches |
| `MONTHLY_MVP_3`          | Monthly | Weekly MVP awards ≥ 3 |      3 matches |

A period key is appended to each default challenge code, so every week and month has an immutable challenge instance.

## Data integrity

- Only verified periodic statistics are used.
- Dates must exactly match the configured league week or month.
- Database dates remain UTC; league boundaries use the configured timezone.
- One player can have only one progress record per challenge.
- A completed progress record is not reverted by later recalculation.
- Historical challenge and reward snapshots remain attached to player progress.
- Match verification and approved corrections trigger affected-player recalculation.
- Corrections refresh both the old and new match-date periods.
- Completion notifications are created only for linked users.
- Administrative mutations and recalculations require audit reasons.

## Lifecycle

```text
Draft → Upcoming → Active → Completed → Archived
```

Unfinished progress becomes `expired` when the challenge closes. Completed progress remains `completed`.

## Progress rules

For increasing targets (`gte`, `gt`):

```text
progress = min(100, currentValue / targetValue × 100)
```

For decreasing targets (`lte`, `lt`), completion occurs when the current value is below the configured boundary. Minimum-match and optional compound eligibility rules must also pass.

## API routes

### Public

```text
GET /api/v1/challenges
GET /api/v1/challenges/:identifier
GET /api/v1/challenges/players/:playerId
```

### Admin

```text
GET   /api/v1/challenges/admin/manage/list
POST  /api/v1/challenges/admin/manage
PATCH /api/v1/challenges/admin/manage/:challengeId
POST  /api/v1/challenges/admin/manage/:challengeId/status
POST  /api/v1/admin/challenges/recalculate
```

## Frontend routes

```text
/challenges
/challenges/:challengeCode
/players/:playerId/challenges
/player/challenges
/admin/challenges
```

## Automatic workflow

```text
Verified match or approved correction
        ↓
Core and periodic statistics recalculation
        ↓
Challenge evaluation for affected players
        ↓
Progress upsert
        ↓
Completion snapshot + notification + audit log
```

## MongoDB Atlas

Run once after deploying this module:

```bash
npm run challenges:migrate-indexes
```

Atlas provides the replica-set transaction support required by the evaluation workflow.

## Run

```bash
npm install
npm run challenges:migrate-indexes
npm run dev
```

## Test

```bash
npm run lint
npm run test
npm run build
```
