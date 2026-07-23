# Phase 12D — Achievement System

## Implemented scope

- Versioned achievement definitions with one active version per code
- Required default achievements:
  - First Blood
  - 100 Kills Club
  - 500 Kills Club
  - 1000 Kills Club
  - MVP Master
  - King of Arena
  - Legend
  - First Place Streak
  - 20 Kill Strike
  - 30 Kill Rampage
- Structured criteria using supported metrics and operators
- Minimum-match handling
- Per-player progress, condition evidence and unlock timestamps
- Duplicate prevention through `{ playerId, achievementCode }` unique index
- Permanent unlock snapshots that are not rewritten by later formula versions
- Automatic evaluation after match verification
- Automatic re-evaluation after approved verified-match corrections
- Manual admin recalculation for all players or one player
- Admin create, revise, activate and deactivate workflow
- Achievement notifications for linked users
- Audit logs for definition and recalculation actions
- Public achievement catalog
- Public player achievement page
- Linked-player dashboard achievement page
- Player-profile achievement panel

## Main API routes

```text
GET  /api/v1/achievements
GET  /api/v1/achievements/definitions/:code
GET  /api/v1/achievements/players/:playerId

GET  /api/v1/achievements/admin/definitions
POST /api/v1/achievements/admin/definitions
POST /api/v1/achievements/admin/definitions/:achievementId/revisions
POST /api/v1/achievements/admin/definitions/:achievementId/activate
POST /api/v1/achievements/admin/definitions/:achievementId/deactivate
POST /api/v1/admin/achievements/recalculate
```

## Frontend routes

```text
/achievements
/players/:playerId/achievements
/player/achievements
/admin/achievements
```

## MongoDB Atlas setup

MongoDB Atlas is appropriate because verified-match corrections and achievement rule activation use transactions.

If this database previously created the Phase 2 achievement indexes, run the migration once after deploying this version:

```bash
npm run achievements:migrate-indexes
```

The migration removes these obsolete indexes when they exist:

```text
achievements.code_1
playerAchievements.playerId_1_achievementId_1
```

It then synchronizes the new indexes:

```text
achievements: { code, version } unique
achievements: one active version per code
playerAchievements: { playerId, achievementCode } unique
```

Do not run index migration while another deployment is changing achievement definitions.

## Data-integrity rules

- Only verified statistics are evaluated.
- An unlocked achievement is never revoked by later performance changes.
- An unlocked snapshot keeps the original code, version, description and target.
- Activating a new definition version does not silently rewrite old unlocks.
- Locked progress may move to the newly active version during recalculation.
- The backend, not the client, calculates all progress and unlock state.
- Automatic achievement failure never rolls back an already verified match; it is returned as a separate failed evaluation state and can be retried by an admin.

## Recalculation example

```json
{
  "reason": "Recalculate all active achievements after verified statistics updates."
}
```

Single player:

```json
{
  "playerId": "MM001",
  "reason": "Recalculate achievement progress after an approved match correction."
}
```

## Validation completed

- ESLint
- Vitest client tests
- Vitest server tests
- Production Vite build
- Mongoose model validation
- Achievement rule and request validation tests
- Server application import
- OpenAPI supplement parsing
