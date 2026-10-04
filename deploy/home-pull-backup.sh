#!/usr/bin/env bash
# Run on your HOME computer, nightly (cron on Mac/Linux, or WSL + Task Scheduler on Windows):
#   0 23 * * *  /path/to/home-pull-backup.sh >> ~/rewards-backup/pull.log 2>&1
# Copies the droplet's snapshots, exports, photos and files. Missed nights catch up on the next run.
set -euo pipefail

DROPLET="${REWARDS_DROPLET:?set REWARDS_DROPLET to backup@<droplet-ip>}"
DEST="${REWARDS_BACKUP_DIR:-$HOME/rewards-backup}"
mkdir -p "$DEST"

for dir in backups photos files; do
  rsync -az --partial "$DROPLET:/var/lib/rewards/$dir/" "$DEST/$dir/"
done
date "+%F %T pulled OK"
