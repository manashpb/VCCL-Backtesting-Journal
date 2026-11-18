#!/usr/bin/env bash
# Run from the deployed checkout; use the default data paths below.
set -euo pipefail
umask 077
app_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${1:?Usage: bash scripts/backup.sh /absolute/private/backup/directory}"
case "$backup_dir" in /*) ;; *) echo 'Use an absolute backup directory' >&2; exit 1 ;; esac
mkdir -p -- "$backup_dir"
chmod 700 -- "$backup_dir"
cd -- "$app_dir"
test -f server/backtesting.db || { echo 'Default database not found; review configured DB_PATH before backing up' >&2; exit 1; }
mkdir -p server/snapshots
pm2 stop backtesting-journal >/dev/null
trap 'pm2 restart backtesting-journal >/dev/null' EXIT
archive="$backup_dir/backtesting-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
tar -czf "$archive" server/backtesting.db server/snapshots
chmod 600 -- "$archive"
echo "Saved consistent database and screenshots: $archive"
