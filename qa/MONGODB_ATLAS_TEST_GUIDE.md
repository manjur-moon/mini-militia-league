# MongoDB Atlas QA Guide

## Staging database

Use a separate Atlas database, for example:

```env
MONGODB_DB_NAME=mini_militia_staging
```

Never run destructive QA against the production database.

## Required checks

1. Confirm the cluster is a replica set and transactions succeed.
2. Run all index migration commands from Phases 12D–12K.
3. Start the server and confirm `/api/v1/health` reports database connectivity.
4. Create concurrent players and verify unique `MM###` IDs.
5. Verify a match and confirm all official writes commit atomically.
6. Force a recalculation failure in staging and verify the match remains official with a recoverable recalculation status.
7. Approve a verified-match revision and confirm dependent caches refresh.
8. Review Atlas Performance Advisor after realistic list, search and leaderboard queries.
9. Confirm backup policy before production launch.

## Optional local replica-set suite

```bash
npm run test:database:memory
```

The first run needs a MongoDB binary. In CI, cache the binary or configure `MONGOMS_SYSTEM_BINARY`.
