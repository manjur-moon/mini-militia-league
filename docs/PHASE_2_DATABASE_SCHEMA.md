# Phase 2 — Database Schema Design

## Final collection strategy

### Better Auth-owned collections

Better Auth's official MongoDB adapter owns these collections. Do not create a parallel Mongoose authentication model or custom JWT/password store.

| Collection     | Purpose                             | Required/core fields                                                                                                                                | Important indexes                                                                  |
| -------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `user`         | Identity and account status         | `id`, `name`, `email`, `emailVerified`, `image`, timestamps; Admin plugin: `role`, `banned`, `banReason`, `banExpires`; app field: `linkedPlayerId` | unique `email`; unique sparse `linkedPlayerId` should be created during auth setup |
| `session`      | Secure Better Auth sessions         | `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, timestamps, `impersonatedBy`                                                        | unique `token`; `userId`; TTL/expiry handling owned by Better Auth                 |
| `account`      | Credential/social provider accounts | `id`, `userId`, `accountId`, `providerId`, provider tokens, `password`, timestamps                                                                  | compound provider/account identity; `userId`                                       |
| `verification` | Email/password verification tokens  | `id`, `identifier`, `value`, `expiresAt`, timestamps                                                                                                | `identifier`; `expiresAt`                                                          |

Better Auth user IDs are strings. Mongoose application collections therefore store actor/user references as strings. Player and match domain IDs remain MongoDB ObjectIds.

## Application collections

| Collection / model                             | Purpose                                               | Main validation                                           | Main indexes and relationships                                                            |
| ---------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `playerCounters` / `PlayerCounter`             | Atomic human-readable player ID sequence              | non-negative sequence                                     | unique `key`; updated using atomic `$inc`                                                 |
| `players` / `Player`                           | League player profile                                 | `MM###` ID, normalized name, status enum                  | unique `playerId`; unique sparse `linkedUserId`; name/status search indexes               |
| `leagueConfigs` / `LeagueConfig`               | Single-league timezone, week boundary and branding    | IANA timezone handled by service; week day 0–6            | unique singleton `key`                                                                    |
| `seasons` / `Season`                           | Season lifecycle and historical snapshot              | valid date range; status enum                             | unique slug; one active season; date/status indexes                                       |
| `matches` / `Match`                            | Screenshot evidence and match workflow                | required screenshot, date, participant count, status enum | unique match code; exact screenshot SHA-256; status/date/season indexes                   |
| `matchResults` / `MatchResult`                 | Raw OCR row, corrected row and immutable official row | non-negative kills/deaths; placement >= 1                 | unique row per match; unique verified player and placement per match; player/date indexes |
| `matchRevisions` / `MatchRevision`             | Controlled verified-match corrections                 | required reason and before/proposed snapshots             | unique match/revision; status/date                                                        |
| `ocrJobs` / `OCRJob`                           | Provider-neutral persisted OCR processing             | retry count, confidence 0–1, persisted errors             | unique match; queue/retry/lock indexes                                                    |
| `playerStatistics` / `PlayerStatistics`        | Persisted all-time official aggregate                 | finite numbers; percentages 0–100                         | unique player; kills/KDR/global-rank indexes                                              |
| `periodicStatistics` / `PeriodicStatistics`    | Weekly/monthly/season cached aggregates               | finite values and period identity                         | unique player/period; leaderboard metric indexes                                          |
| `leaderboardSnapshots` / `LeaderboardSnapshot` | Reproducible cached leaderboards                      | source hash and formula version                           | unique metric/period/version                                                              |
| `rivalryStatistics` / `RivalryStatistics`      | Cached player-vs-player comparisons                   | canonical pair key and finite KDR                         | unique pair key; both-player indexes                                                      |
| `mvpConfigs` / `MVPConfig`                     | Versioned centralized MVP formula                     | finite non-negative weights and caps                      | unique version; only one active config                                                    |
| `mvpAwards` / `MVPAward`                       | Historical MVP award snapshot                         | finite score and full breakdown                           | one current award per period; player/date                                                 |
| `ratingConfigs` / `RatingConfig`               | Versioned documented rating normalization             | component/overall weights; minimum sample                 | unique version; one active config                                                         |
| `playerRatings` / `PlayerRating`               | Versioned calculated player ratings                   | each rating 0–100; confidence 0–1                         | unique player/period/formula; overall ranking                                             |
| `dynamicTitles` / `DynamicTitle`               | Admin-managed temporary title rules                   | structured rule set, priority, minimum matches            | unique code+version; one active version per code; active/priority                         |
| `playerTitles` / `PlayerTitle`                 | Title award history/current title                     | evidence and rule version                                 | unique award; one current title per player                                                |
| `achievements` / `Achievement`                 | Extensible achievement definitions                    | structured rule set and unique code                       | unique code; category/status                                                              |
| `playerAchievements` / `PlayerAchievement`     | Progress and unlock state                             | progress 0–100; evidence on unlock                        | unique player/achievement                                                                 |
| `challenges` / `Challenge`                     | Weekly/monthly challenge definition                   | valid range, target metric/value                          | unique code; type/status/date                                                             |
| `playerChallenges` / `PlayerChallenge`         | Per-player challenge progress                         | finite target/current values                              | unique player/challenge; status indexes                                                   |
| `notifications` / `Notification`               | User notifications                                    | allowed type and explicit read state                      | user/read/date and user/type/date                                                         |
| `auditLogs` / `AuditLog`                       | Append-only sensitive-action history                  | sanitized before/after values                             | entity timeline, actor timeline, action timeline                                          |
| `aiSummaries` / `AISummary`                    | Cached AI or deterministic summaries                  | source metrics/hash, prompt version, validation warnings  | unique context/source hash; period/player indexes                                         |
| `hallOfFameRecords` / `HallOfFameRecord`       | Immutable historical records                          | finite record value and evidence snapshot                 | one current record per category/season; player/date                                       |

## Relationship rules

```text
Better Auth user.id (string)
    └── user.linkedPlayerId (string representation of Player._id)
            └── Player._id (ObjectId)

Player 1 ── 1 PlayerStatistics
Player 1 ── N PeriodicStatistics
Player 1 ── N MatchResult (official.playerId)
Match  1 ── N MatchResult
Match  1 ── 1 OCRJob
Match  1 ── N MatchRevision
Season 1 ── N Match
MVPConfig version ── N MVPAward
RatingConfig version ── N PlayerRating
Achievement 1 ── N PlayerAchievement
Challenge 1 ── N PlayerChallenge
DynamicTitle 1 ── N PlayerTitle
```

## Live, cached and persisted calculations

### Source of truth

- `matches` with `status: verified`
- `matchResults` with `status: verified`
- `official` result snapshot only

### Persisted aggregates

Persist because they are frequently read and expensive to rebuild on every request:

- `PlayerStatistics`
- `PeriodicStatistics`
- `LeaderboardSnapshot`
- `RivalryStatistics`
- `PlayerRating`
- `MVPAward`
- award/title/challenge progress
- Hall of Fame snapshots

Every persisted aggregate contains a calculation/formula version, source count or source hash, and recalculation timestamp.

### Calculated live

Calculate live when cheap or highly contextual:

- a single match KDR
- small recent-match feed projections
- UI-only formatting
- pagination metadata
- simple profile display labels

### Never persist as authoritative client input

- KDR supplied by frontend
- win rate supplied by frontend
- ratings supplied by frontend
- MVP score supplied by frontend
- leaderboard rank supplied by frontend

## Data-integrity enforcement

1. Atomic `$inc` on `PlayerCounter` plus unique `players.playerId` index prevents duplicate player IDs.
2. Unique `matchResults(matchId,rowIndex)` prevents duplicated OCR rows.
3. Partial unique `matchResults(matchId,official.playerId)` prevents one verified player appearing twice.
4. Partial unique `matchResults(matchId,official.placement)` prevents two official placements in one match.
5. Exact screenshot SHA-256 index prevents identical uploads.
6. One active `Season`, `MVPConfig`, and `RatingConfig` is enforced by partial unique indexes.
7. `MatchRevision` preserves previous and proposed verified snapshots.
8. `AuditLog` is append-only at model middleware level; database permissions should also prevent destructive mutation.
9. Historical MVP and Hall of Fame records are superseded, not overwritten.
10. Database timestamps are UTC; league timezone is stored with every period boundary.

## Required service-level rules not safely expressible by schema alone

- Match status transitions must follow the approved state machine.
- Season ranges must not overlap, including upcoming seasons if business rules disallow it.
- Match participant count must equal final verified result count.
- Corrected player IDs and placements must be unique before verification.
- A verified-match correction must run in a MongoDB transaction when deployment supports transactions.
- Better Auth `user.linkedPlayerId` and `Player.linkedUserId` must be updated together.
- Overall rating weights and each component metric weights must total `1`.
- Player IDs must be generated through an atomic counter service, never with `countDocuments() + 1`.
- Raw OCR values must never be overwritten by corrected or official values.
- Audit snapshots must be recursively sanitized to remove tokens, passwords, cookies and credentials.

## Common schema mistakes to avoid

- Using ObjectId for Better Auth user IDs.
- Creating custom password/session Mongoose models alongside Better Auth.
- Embedding all match results inside Match and making analytics queries expensive.
- Updating official match rows without a revision and recalculation process.
- Storing `Infinity`, `NaN`, formatted percentage strings or frontend-calculated values.
- Hard-deleting players that appear in historical matches.
- Storing temporary title state only on the Player document and losing award history.
- Rewriting old MVP awards when a formula changes.
- Using a single unstructured `Mixed` object for all rule definitions.
- Relying only on application checks without unique database indexes.

## Phase 2 completion

- All required collections evaluated.
- Mongoose application models included under `server/src/models`.
- Better Auth collection contract included without creating a second auth system.
- Core indexes, relationships, versioning and audit requirements included.
- Syntax validation passed with `node --check`.
