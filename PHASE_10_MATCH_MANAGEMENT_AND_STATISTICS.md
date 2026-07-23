# Phase 10 — Match Management and Statistics

## Implemented

- Public verified-match history and screenshot gallery
- Public verified-match detail and official scoreboard
- Moderator/Admin match archive with OCR and review metadata
- Pending match metadata update
- Manual result-row create, update and soft removal
- Verified-only player match history
- Linked-player personal match history
- Persisted core player statistics
- Personal records with evidence match references
- Statistics reconciliation status per verified match
- Admin statistics rebuild by all players, one player or one match
- Controlled verified-match correction through versioned revisions
- Before/proposed snapshots, approval/rejection and audit logging
- Automatic affected-player recalculation after verification or correction

## Official-data rule

Only `Match.status = verified` and `MatchResult.status = verified` with an `official` snapshot are used. Raw OCR and corrected pending values never affect official statistics.

## Core formulas (`core-v1`)

```text
Matches Played = verified result rows
Total Kills = sum of verified kills
Total Deaths = sum of verified deaths
Average Kills = total kills / matches played
Average Deaths = total deaths / matches played
Average Rank = placement sum / matches played
Win Rate = first-place count / matches played × 100
```

Finite KDR rule:

```text
Deaths > 0                    => kills / deaths
Deaths = 0 and kills > 0      => kills
Deaths = 0 and kills = 0      => 0
```

No statistic can persist `Infinity` or `NaN`. Backend stores unformatted values; the client formats display values.

## Personal records

- Highest kills in one verified match
- Highest deaths in one verified match
- Best verified-match KDR
- Longest first-place streak
- Most matches played in one league-timezone day
- Longest MVP streak remains `0` until Phase 11 creates official period MVP awards

## Global rank in Phase 10

The provisional `core-v1` rank order is:

1. Total kills descending
2. KDR descending
3. First-place count descending
4. Matches played descending
5. Stable player reference ordering

Dedicated weekly/monthly/season leaderboard rules are Phase 11 work.

## Main API routes

### Match reads

```text
GET    /api/v1/matches
GET    /api/v1/matches/:matchId
```

Public requests receive verified-only safe projections. Moderator/Admin sessions can receive protected archive fields.

### Pending match management

```text
PATCH  /api/v1/matches/:matchId
POST   /api/v1/matches/:matchId/results
PATCH  /api/v1/matches/:matchId/results/:resultId
DELETE /api/v1/matches/:matchId/results/:resultId
PATCH  /api/v1/matches/:matchId/review
POST   /api/v1/matches/:matchId/verify
POST   /api/v1/matches/:matchId/reject
```

### Verified-match revisions

```text
GET    /api/v1/matches/:matchId/revisions
GET    /api/v1/matches/:matchId/revisions/:revisionNumber
POST   /api/v1/matches/:matchId/revisions
POST   /api/v1/matches/:matchId/revisions/:revisionNumber/approve
POST   /api/v1/matches/:matchId/revisions/:revisionNumber/reject
```

Only Admin can propose, approve or reject verified-match revisions. An approved revision requires a reason, verifies expected revision state, writes official rows transactionally, records before/after snapshots and recalculates all affected players.

### Player statistics and history

```text
GET /api/v1/players/me/profile
GET /api/v1/players/me/matches
GET /api/v1/players/:playerId/profile
GET /api/v1/players/:playerId/matches
GET /api/v1/players/:playerId/statistics
GET /api/v1/players/:playerId/records
```

### Statistics administration

```text
GET  /api/v1/statistics/overview
POST /api/v1/admin/statistics/recalculate
```

Recalculation body examples:

```json
{
  "scope": "all",
  "reason": "Reconcile verified match statistics after deployment"
}
```

```json
{
  "scope": "player",
  "playerId": "6650c4f79c5fe11a9a010001",
  "reason": "Rebuild one affected player cache"
}
```

```json
{
  "scope": "match",
  "matchId": "6650c4f79c5fe11a9a020001",
  "reason": "Rebuild players affected by this match"
}
```

Every manual rebuild is audit logged.

## Transaction requirement

Verification and approved revision workflows use MongoDB transactions. Use MongoDB Atlas or a replica-set-enabled MongoDB deployment. A standalone local MongoDB process does not support transactions.

## Run

```bash
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run admin:bootstrap
npm run dev
```

## Validate

```bash
npm run format:check
npm run check
```

## Important constraints

- Verified matches are never edited through the pending-match update endpoints.
- Result removal before verification is non-destructive; raw evidence remains.
- Approved corrections increment the match revision.
- Original screenshots remain preserved.
- Public APIs never return raw OCR output, image storage identifiers, checksums, uploader IDs or audit internals.
- Statistics are persisted caches and remain reproducible from verified match results.
