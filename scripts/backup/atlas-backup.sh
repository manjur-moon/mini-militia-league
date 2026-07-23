#!/usr/bin/env bash
set -euo pipefail

: "${MONGODB_URI:?MONGODB_URI is required}"
: "${MONGODB_DB_NAME:?MONGODB_DB_NAME is required}"

command -v mongodump >/dev/null 2>&1 || {
  echo "mongodump is required. Install MongoDB Database Tools first." >&2
  exit 1
}

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE_PATH="${BACKUP_DIR}/${MONGODB_DB_NAME}-${TIMESTAMP}.archive.gz"

mkdir -p "$BACKUP_DIR"

mongodump \
  --uri="$MONGODB_URI" \
  --db="$MONGODB_DB_NAME" \
  --archive="$ARCHIVE_PATH" \
  --gzip

sha256sum "$ARCHIVE_PATH" > "${ARCHIVE_PATH}.sha256"
echo "Backup created: $ARCHIVE_PATH"
