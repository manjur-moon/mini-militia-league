# Phase 11: Leaderboards, MVP and Analytics

## Implemented scope

- Weekly, monthly, active-season and all-time leaderboards
- Kills, deaths, KDR, activity, placement, win-rate, average-rank and overall rankings
- Weekly, monthly, season and all-time MVP calculation
- Versioned and configurable MVP scoring formulas
- Historical award preservation and explicit recalculation
- Weekly/monthly top-three and most-improved analytics
- Player 7-day and 30-day performance trends
- Weekly, monthly, season and global player ranks
- Best/worst match, most-active day, best week/month, efficiency, consistency and improvement analytics
- Persisted periodic statistics and leaderboard snapshots
- Source-data fingerprinting and deterministic cache invalidation
- Admin analytics/MVP controls and append-only audit records

## Official-data rule

Only `MatchResult` documents with `status: "verified"`, whose parent `Match` is also verified, are included. Client-provided statistics are never trusted.

## League period boundaries

- Dates are stored in UTC.
- Weekly and monthly boundaries are resolved in the configured league IANA timezone.
- Date-only filters are interpreted as league-local calendar dates.
- Period end timestamps are exclusive: `startAt <= matchDate < endAt`.
- The configured `weekStartsOn` value controls weekly boundaries.
- An active season is used when a season endpoint is called without an explicit season ID.

## Default MVP formula

```text
Kill score          = total kills × 1.00
Death penalty       = total deaths × 0.35
Placement bonus     = first × 15 + second × 8 + third × 4
KDR bonus           = min(KDR × 5, 20)
Activity adjustment = min(matches × 1, 10)
MVP score           = kill score - death penalty
                      + placement bonus + KDR bonus
                      + activity adjustment
```

Default eligibility requires 3 verified matches. Every award stores:

- score and score breakdown
- formula version
- period boundaries and timezone
- source-data hash
- player and season reference
- current or superseded status

Changing the active formula does not silently rewrite historical awards. Closed periods and awards created with an older formula return a stale indicator until an administrator explicitly recalculates them.

## Analytics definitions

### Overall period performance

Uses the active MVP formula and its minimum-match rule. Rankings use deterministic tie-breakers:

1. Higher performance score
2. Higher total kills
3. Lower total deaths
4. Higher first-place count
5. Stable player identifier ordering

### Most improved

The player's average performance score in the selected week/month is compared with the immediately preceding equivalent period:

```text
Improvement % =
(current average - previous average) / max(abs(previous average), 1) × 100
```

Both periods must meet the active formula's minimum-match requirement.

### Kill efficiency

```text
kills / (kills + deaths) × 100
```

Returns `0` when both values are zero.

### Consistency

```text
100 / (1 + coefficient of variation)
```

The coefficient of variation uses per-match performance scores. Zero matches return `0`; one match returns a neutral sample score of `50`.

### Best and worst match

Uses the configured per-match MVP score without the period activity adjustment. Ties use kills, deaths and match date.

### Best week and month

Uses highest average match-performance score, subject to the active minimum-match requirement. Total performance score is the secondary tie-breaker.

### Improvement tracking

Compares the latest 30-day window with the preceding 30-day window. Both windows must meet the configured minimum-match requirement.

## Cache and recalculation strategy

`PeriodicStatistics` persists player metrics for a period. The source hash includes:

- verified-result count
- latest verified-result update timestamp
- total kills, deaths and placements checksums
- calculation version
- active MVP formula version
- period identity

A matching hash is a cache hit. When verified source data or the formula changes, statistics are rebuilt. Leaderboard snapshots are regenerated from periodic statistics. Explicit admin recalculation invalidates affected snapshots and writes an audit record.

## Public API routes

```text
GET /api/v1/analytics/leaderboards
GET /api/v1/analytics/periods/:periodType
GET /api/v1/analytics/global
GET /api/v1/analytics/most-improved

GET /api/v1/mvp/current
GET /api/v1/mvp/awards
GET /api/v1/mvp/config

GET /api/v1/players/:playerId/performance
GET /api/v1/players/:playerId/advanced-analytics
```

## Admin API routes

```text
POST /api/v1/admin/analytics/recalculate
GET  /api/v1/admin/analytics/mvp/configs
POST /api/v1/admin/analytics/mvp/configs
POST /api/v1/admin/analytics/mvp/configs/:configId/activate
POST /api/v1/admin/analytics/mvp/recalculate
```

Sensitive changes require an authenticated Admin role, a reason, backend validation and audit logging.

## Frontend routes

```text
/leaderboards
/analytics
/mvp
/player/performance
/admin/analytics
```

The performance graph is lazy-loaded to keep Recharts out of the initial application bundle.

## Run and verify

```bash
npm install
npm run check
npm run dev
```

Create the initial admin when required:

```bash
npm run admin:bootstrap
```

## Production notes

- MongoDB Atlas or a replica-set-enabled MongoDB deployment is required for MVP formula activation and award recalculation transactions.
- Seed or create an active season before requesting active-season analytics.
- Use the admin recalculation endpoint after controlled corrections when an explicit immediate rebuild is required.
- Never alter historical MVP documents directly.
