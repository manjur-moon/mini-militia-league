# Phase 12A — Player Rating System

## Implemented

- Attack, Survival, Consistency, Activity and Overall ratings
- Verified-match-only calculation
- Weekly, monthly, season and all-time periods
- 0–100 normalization
- Minimum-match eligibility
- New-player confidence adjustment toward a neutral score of 50
- Immutable formula versions
- Active formula management
- Persisted input snapshots and source-data hashes
- Rating leaderboard and player rating history
- Public player-profile rating panel
- Player dashboard performance rating panel
- Admin formula configuration and explicit recalculation
- Audit logs for config creation, activation and recalculation

## Default formula: `rating-v1`

### Attack

| Metric        | Normalization | Weight |
| ------------- | ------------- | -----: |
| Average kills | Target 25     |    45% |
| KDR           | Target 1.5    |    35% |
| Win rate      | Target 40%    |    20% |

### Survival

| Metric          | Normalization      | Weight |
| --------------- | ------------------ | -----: |
| Average deaths  | Inverse target 25  |    45% |
| Average rank    | Inverse target 2   |    35% |
| Last-place rate | Inverse target 20% |    20% |

### Consistency

| Metric                        | Normalization       | Weight |
| ----------------------------- | ------------------- | -----: |
| Kill coefficient of variation | Inverse target 0.35 |    55% |
| Placement standard deviation  | Inverse target 1.25 |    45% |

### Activity

| Metric            | Normalization | Weight |
| ----------------- | ------------- | -----: |
| Verified matches  | Target 10     |    70% |
| Active match days | Target 5      |    30% |

### Overall weights

```text
Attack 35% + Survival 25% + Consistency 25% + Activity 15%
```

### Sample confidence

```text
confidence = floor + (1 - floor) × min(matches / minimumMatches, 1)
adjustedScore = 50 + (rawScore - 50) × confidence
```

Default minimum matches: `5`  
Default confidence floor: `0.25`

A player with no verified matches receives zero ratings. A player below the minimum sample receives a provisional rating and no official rating rank.

## API routes

### Public

```text
GET /api/v1/ratings/config
GET /api/v1/ratings/leaderboard
GET /api/v1/players/:playerId/ratings
GET /api/v1/ratings/players/:playerId/history
```

### Admin

```text
GET  /api/v1/ratings/configs
POST /api/v1/ratings/configs
POST /api/v1/ratings/configs/:version/activate
POST /api/v1/admin/ratings/recalculate
```

## Main files

```text
server/src/models/rating-config.model.js
server/src/models/player-rating.model.js
server/src/services/rating-math.service.js
server/src/services/rating-config.service.js
server/src/services/rating.service.js
server/src/controllers/rating.controller.js
server/src/validators/rating.validation.js
server/src/routes/rating.routes.js
server/src/routes/admin-rating.routes.js
client/src/services/rating.service.js
client/src/features/ratings/components/rating-breakdown.jsx
client/src/features/ratings/components/player-rating-panel.jsx
client/src/pages/ratings.page.jsx
client/src/pages/admin-ratings.page.jsx
```

## Run and verify

```bash
npm install
npm run check
npm run dev
```

Public pages:

```text
/ratings
/players/:playerId
```

Admin page:

```text
/admin/ratings
```

## Important rules

- Only verified match rows are rating inputs.
- Client-provided ratings are never accepted.
- Formula versions are immutable.
- Activating a formula does not rewrite historical ratings.
- Explicit recalculation is audited.
- Inputs, normalized metrics, weights, confidence and source hash are persisted for reproducibility.
- `NaN`, `Infinity` and out-of-range ratings are prevented.
