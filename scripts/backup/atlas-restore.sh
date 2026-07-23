#!/usr/bin/env bash
set -euo pipefail

: "${MONGODB_URI:?MONGODB_URI is required}"
: "${MONGODB_DB_NAME:?MONGODB_DB_NAME is required}"
: "${BACKUP_ARCHIVE:?BACKUP_ARCHIVE must point to an .archive.gz file}"

if [[ "${ALLOW_DESTRUCTIVE_RESTORE:-no}" != "yes" ]]; then
  echo "Set ALLOW_DESTRUCTIVE_RESTORE=yes to confirm the restore." >&2
  exit 1
fi

command -v mongorestore >/dev/null 2>&1 || {
  echo "mongorestore is required. Install MongoDB Database Tools first." >&2
  exit 1
}

if [[ ! -f "$BACKUP_ARCHIVE" ]]; then
  echo "Backup archive not found: $BACKUP_ARCHIVE" >&2
  exit 1
fi

if [[ -f "${BACKUP_ARCHIVE}.sha256" ]]; then
  sha256sum --check "${BACKUP_ARCHIVE}.sha256"
fi

mongorestore \
  --uri="$MONGODB_URI" \
  --nsInclude="${MONGODB_DB_NAME}.*" \
  --archive="$BACKUP_ARCHIVE" \
  --gzip \
  --drop

echo "Restore completed for database: $MONGODB_DB_NAME"
