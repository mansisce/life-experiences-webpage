#!/usr/bin/env bash
# Deploy a commit of the Rewards BFF and dashboard on the droplet, with automatic rollback.
#
#   sudo rewards-deploy <git-ref>      # e.g. a commit SHA, or origin/main
#
# Installed root-owned as /usr/local/sbin/rewards-deploy (see deploy/README.md), so the GitHub
# Actions "deploy" user can run exactly this script with sudo and nothing else.
set -euo pipefail

REF="${1:?usage: rewards-deploy <git-ref>}"
APP=/opt/rewards
HEALTH=http://127.0.0.1:8000/health
as_app() { sudo -u rewards -H "$@"; }

cd "$APP"
PREVIOUS=$(as_app git rev-parse HEAD)

install_and_restart() {
  as_app git checkout --quiet --detach "$1"
  (cd services/bff && as_app uv sync --frozen --no-dev --quiet)
  (cd apps/rewards-dashboard && as_app uv sync --frozen --quiet)
  systemctl restart rewards-bff rewards-dashboard
}

healthy() {
  for _ in $(seq 1 30); do
    curl -fsS "$HEALTH" >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

as_app git fetch --quiet origin
TARGET=$(as_app git rev-parse --verify "$REF^{commit}")
echo "Deploying $TARGET (was $PREVIOUS)"
install_and_restart "$TARGET"

if healthy; then
  echo "OK: $TARGET is live"
  exit 0
fi

echo "Health check failed; rolling back to $PREVIOUS" >&2
journalctl -u rewards-bff -n 30 --no-pager >&2 || true
install_and_restart "$PREVIOUS"
# A failed deploy that ran a schema migration can't be undone by code alone: restore the
# pre-upgrade copy from /var/lib/rewards/backups if the old code won't start (deploy/README.md).
healthy && echo "Rolled back to $PREVIOUS" >&2 || echo "Rollback is unhealthy too; see deploy/README.md" >&2
exit 1
