# Phase 12G — Hall of Fame System

## Scope

This module adds immutable, evidence-backed Hall of Fame records calculated only from verified match data.

## Categories and definitions

| Category               | Definition                                                                       | Tie-breakers                                            |
| ---------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Season Champion        | Eligible rank-one player from the completed or archived season performance table | Rank, performance score, first places, kills, player ID |
| All-Time Legend        | Eligible rank-one player from the versioned all-time performance table           | Rank, performance score, first places, kills, player ID |
| Most Kills             | Highest verified all-time kill total                                             | First places, fewer deaths, player ID                   |
| Most MVP Awards        | Most current official weekly/monthly/season/all-time MVP awards                  | Combined MVP score, latest award, player ID             |
| Best KDR               | Highest verified all-time KDR after the active minimum-match threshold           | Kills, fewer deaths, player ID                          |
| Longest Winning Streak | Longest consecutive first-place streak from chronological verified matches       | Total first places, kills, player ID                    |

## Historical snapshot rule

A current record is never overwritten. When its player or value changes:

1. The current record becomes `historical`.
2. Its supersession date, reason and replacement record ID are stored.
3. A new `current` snapshot is inserted.
4. Player, season, criteria, evidence, calculation version and source-data hash remain preserved on each snapshot.

If a recalculation produces the same player, value, period and source version, no duplicate snapshot is created.

## Main backend files

```text
server/src/models/hall-of-fame-record.model.js
server/src/services/hall-of-fame-ranking.service.js
server/src/services/hall-of-fame.service.js
server/src/controllers/hall-of-fame.controller.js
server/src/validators/hall-of-fame.validation.js
server/src/routes/hall-of-fame.routes.js
server/src/routes/admin-hall-of-fame.routes.js
server/src/scripts/migrate-hall-of-fame-indexes.js
```

## Main frontend files

```text
client/src/services/hall-of-fame.service.js
client/src/features/hall-of-fame/components/hall-of-fame-record-card.jsx
client/src/features/hall-of-fame/components/player-hall-of-fame-panel.jsx
client/src/pages/hall-of-fame.page.jsx
client/src/pages/player-hall-of-fame.page.jsx
client/src/pages/admin-hall-of-fame.page.jsx
```

## API routes

```text
GET  /api/v1/hall-of-fame
GET  /api/v1/hall-of-fame/:category
GET  /api/v1/hall-of-fame/players/:playerId
POST /api/v1/admin/hall-of-fame/recalculate
```

### Public list query parameters

```text
page
limit
category
status=current|historical|all
seasonId
```

### Admin recalculation body

```json
{
  "category": "most_kills",
  "reason": "Refresh the official record after verified statistics changed."
}
```

Season champion recalculation requires a completed or archived season:

```json
{
  "category": "season_champion",
  "seasonId": "64b64c6f2f5d4e1a2b3c4d5e",
  "reason": "Finalize the completed season champion."
}
```

Omitting both `category` and `seasonId` recalculates all global categories and every completed/archived season.

## Automatic workflow

After a match is verified, or a verified correction is approved:

```text
Core statistics recalculation
        ↓
Achievements, rivalries and challenges refresh
        ↓
Global Hall of Fame recalculation
        ↓
Current record retained or historical snapshot created
        ↓
Append-only audit records written
```

A Hall of Fame refresh failure does not roll back the already verified match. The verification response reports `HALL_OF_FAME_RECALCULATION_FAILED`, and an admin can retry explicitly.

## MongoDB Atlas setup

Transactions used for record replacement require MongoDB Atlas or another replica-set-enabled deployment.

Run once after deploying this schema:

```bash
npm run hall-of-fame:migrate-indexes
```

The primary uniqueness rule is one current record per category and season scope:

```text
category + seasonId + status=current
```

Global categories use `seasonId: null`; season champions use the actual season ID.

## Security and integrity

- Public routes expose snapshots only, not private user-account data.
- Recalculation is admin-only.
- Request body and query parameters are validated with Zod.
- Every manual recalculation requires an audit reason.
- Record replacement runs in a MongoDB transaction.
- Audit logs are append-only.
- Historical snapshots keep formula/source versions and source hashes.
- Best KDR applies the active minimum-match rule.
- Only current official MVP awards count toward the MVP-record category.

## Commands

```bash
npm install
npm run hall-of-fame:migrate-indexes
npm run check
npm run dev
```
