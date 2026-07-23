# Phase 12E: Rivalry System

## Implemented scope

- Player-vs-player rivalry statistics from shared verified matches
- Shared-match count, wins, losses, draws, kills, deaths and comparative KDR
- Head-to-head evidence list with links to verified matches
- Rival of the Week
- Player-profile rivalry panel
- Public rivalry pages
- Admin recalculation controls
- Versioned and reproducible rivalry cache
- Automatic cache refresh after match verification and approved corrections
- Audit logging for manual recalculation

## Head-to-head rule

For each shared verified match:

1. Better placement wins.
2. Equal placement uses kills as the tie-breaker.
3. Equal placement and equal kills produce a draw.

Deaths never override placement or kills in the head-to-head decision. They remain part of comparative KDR.

## Rival of the Week rule

A pair must share at least two verified matches in the selected league week.

Selection order:

1. More shared matches
2. Higher competitiveness score
3. More combined kills
4. More recent shared match

Competitiveness score is normalized to 0–100 and uses:

- Win-margin closeness: 60%
- Shared-match activity capped at five matches: 30%
- Draw intensity: 10%

Calculation version: `rivalry-v1`.

## Public API

```text
GET /api/v1/rivalries/rival-of-week
GET /api/v1/rivalries/players/:playerId
GET /api/v1/rivalries/players/:playerId/opponents/:opponentId
GET /api/v1/rivalries/players/:playerId/opponents/:opponentId/matches
```

Supported periods:

```text
weekly
monthly
season
all_time
```

Season requests require `seasonId`.

## Admin API

```text
POST /api/v1/admin/rivalries/recalculate
```

Example body:

```json
{
  "periodTypes": ["all_time", "weekly", "monthly"],
  "reason": "Rebuild rivalry caches after verified match review"
}
```

## Frontend routes

```text
/rivalries
/players/:playerId/rivalries
/players/:playerId/rivalries/:opponentId
/admin/rivalries
```

## MongoDB Atlas migration

If an earlier schema created a unique `pairKey_1` index, run once after deployment:

```bash
npm run rivalries:migrate-indexes
```

The current unique cache key is:

```text
pairKey + periodType + periodKey
```

This permits the same player pair to have separate weekly, monthly, season and all-time cache documents.

## Main files

```text
server/src/models/rivalry-statistics.model.js
server/src/services/rivalry-math.service.js
server/src/services/rivalry.service.js
server/src/controllers/rivalry.controller.js
server/src/validators/rivalry.validation.js
server/src/routes/rivalry.routes.js
server/src/routes/admin-rivalry.routes.js
server/src/scripts/migrate-rivalry-indexes.js
client/src/services/rivalry.service.js
client/src/features/rivalries/components/player-rivalry-panel.jsx
client/src/features/rivalries/components/rivalry-summary-card.jsx
client/src/pages/rivalries.page.jsx
client/src/pages/player-rivalries.page.jsx
client/src/pages/rivalry-detail.page.jsx
client/src/pages/admin-rivalries.page.jsx
```

## Data integrity

- Only `MatchResult.status = verified` rows are read.
- Cached values include calculation version and source-data hash.
- Player pair order is normalized to prevent duplicate reverse pairs.
- Match corrections refresh all-time, weekly and monthly caches.
- `Infinity` and `NaN` are blocked.
- Historical match evidence remains linked to source matches.
- Public responses expose player profile information only.

## Performance

- Compound period and player indexes support common reads.
- Cached pair documents avoid rebuilding every rivalry response.
- Source fingerprint checks prevent unnecessary rebuilds.
- Head-to-head evidence is paginated.
- Read-only queries use lean documents.

## Validation result

- Client tests: 10 passed
- Server tests: 103 passed
- ESLint passed
- Production build passed
- Server app import passed
- 26 model exports compiled
