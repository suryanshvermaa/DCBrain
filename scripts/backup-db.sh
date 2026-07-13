#!/usr/bin/env bash
# =============================================================================
# DCBrain — PostgreSQL Database Backup Script
#
# Usage:
#   ./scripts/backup-db.sh
#
# Environment variables (read from .env.prod if present):
#   DATABASE_URL    — PostgreSQL connection string
#   BACKUP_DIR      — Directory to store backups (default: ./backups)
#   BACKUP_RETAIN_DAYS — Days to keep backups (default: 30)
#
# Schedule (crontab example — runs at 02:00 UTC every day):
#   0 2 * * * /opt/dcbrain/scripts/backup-db.sh >> /var/log/dcbrain/backup.log 2>&1
# =============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load .env.prod if it exists (non-interactive cron runs)
if [[ -f "$PROJECT_ROOT/.env.prod" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "$PROJECT_ROOT/.env.prod"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
BACKUP_RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/db-$TIMESTAMP.sql.gz"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[ERROR] DATABASE_URL is not set. Aborting." >&2
  exit 1
fi

# ── Pre-flight ────────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

command -v pg_dump >/dev/null 2>&1 || {
  echo "[ERROR] pg_dump not found. Install postgresql-client." >&2
  exit 1
}

command -v gzip >/dev/null 2>&1 || {
  echo "[ERROR] gzip not found." >&2
  exit 1
}

# ── Backup ────────────────────────────────────────────────────────────────────
echo "[INFO] Starting backup → $BACKUP_FILE"
START_TS="$(date +%s)"

pg_dump \
  --no-password \
  --format=plain \
  --no-owner \
  --no-acl \
  "$DATABASE_URL" \
  | gzip -9 > "$BACKUP_FILE"

END_TS="$(date +%s)"
ELAPSED=$(( END_TS - START_TS ))
SIZE="$(du -sh "$BACKUP_FILE" | cut -f1)"

echo "[INFO] Backup complete: $BACKUP_FILE ($SIZE) in ${ELAPSED}s"

# ── Verify backup is not empty ────────────────────────────────────────────────
if [[ ! -s "$BACKUP_FILE" ]]; then
  echo "[ERROR] Backup file is empty — removing and aborting." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

# ── Rotation: delete backups older than BACKUP_RETAIN_DAYS ───────────────────
echo "[INFO] Rotating backups older than ${BACKUP_RETAIN_DAYS} days..."
DELETED=0
while IFS= read -r old_file; do
  rm -f "$old_file"
  echo "[INFO]   Deleted: $old_file"
  (( DELETED++ )) || true
done < <(find "$BACKUP_DIR" -maxdepth 1 -name "db-*.sql.gz" -mtime +"$BACKUP_RETAIN_DAYS")

echo "[INFO] Rotation complete. Deleted $DELETED old backup(s)."

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL_BACKUPS="$(find "$BACKUP_DIR" -maxdepth 1 -name "db-*.sql.gz" | wc -l | tr -d ' ')"
echo "[INFO] Total backups retained: $TOTAL_BACKUPS"
echo "[OK] Backup job finished at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
