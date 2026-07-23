# Backup and Recovery

## Recommended policy

For a paid Atlas cluster, enable Atlas Cloud Backup and choose a retention schedule appropriate for the league. Test restore access before launch.

Suggested minimum operational policy:

- Daily automated snapshot
- Weekly retained snapshot
- On-demand snapshot before major data migrations
- Quarterly restore drill into a non-production target
- Separate secure storage for exported archives when policy requires it

## Manual archive backup

Install MongoDB Database Tools, export the production variables locally and run:

```bash
export MONGODB_URI='mongodb+srv://...'
export MONGODB_DB_NAME='mini_militia_league'
./scripts/backup/atlas-backup.sh
```

The script writes a compressed archive and SHA-256 checksum under `./backups` unless `BACKUP_DIR` is set.

Do not commit backup files. Backups may contain user email addresses and all league data.

## Restore drill

Never test a destructive restore against production.

```bash
export MONGODB_URI='mongodb+srv://RESTORE_TARGET...'
export MONGODB_DB_NAME='mini_militia_league_restore_test'
export BACKUP_ARCHIVE='./backups/file.archive.gz'
export ALLOW_DESTRUCTIVE_RESTORE=yes
./scripts/backup/atlas-restore.sh
```

After restore:

```bash
npm run db:prepare
npm run deploy:preflight
```

Then verify:

- Better Auth users and sessions exist as expected.
- Players and match screenshots retain references.
- Verified matches reproduce statistics.
- Formula versions and historical awards are intact.
- Audit logs remain append-only.

## Recovery order after data loss

1. Disable match verification and administrative writes.
2. Record incident time and suspected corruption window.
3. Select Atlas point-in-time/snapshot or verified archive.
4. Restore to a new target first.
5. Run migrations and validation.
6. Perform critical workflow smoke tests.
7. Switch application connection only after approval.
8. Preserve the old cluster for forensic review.
