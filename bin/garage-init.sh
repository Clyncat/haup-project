#!/usr/bin/env bash
# First-time Garage setup: cluster layout, access key, bucket.
# Idempotent — safe to re-run; existing resources are skipped.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

g() { docker compose exec -T garage /garage "$@"; }

echo "==> Waiting for Garage to be ready"
until g status >/dev/null 2>&1; do sleep 2; done

echo "==> Layout"
if g status | grep -q "NO ROLE ASSIGNED"; then
  NODE_ID=$(g node id -q | cut -d@ -f1)
  g layout assign -z dc1 -c "${GARAGE_CAPACITY:-200G}" "$NODE_ID"
  # Garage requires the next layout version number explicitly.
  CUR=$(g layout show | grep -oP 'Current cluster layout version:\s*\K[0-9]+' || echo 0)
  g layout apply --version $((CUR + 1))
else
  echo "   layout already exists, skipping"
fi

echo "==> Access key"
if g key info "$S3_ACCESS_KEY_ID" >/dev/null 2>&1; then
  echo "   key already exists, skipping"
else
  # Import the key from .env (instead of 'key create') so credentials stay
  # deterministic and match what the app is configured with.
  g key import -n haup-service --yes "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY"
fi

echo "==> Bucket"
if g bucket info "$S3_BUCKET" >/dev/null 2>&1; then
  echo "   bucket already exists, skipping"
else
  g bucket create "$S3_BUCKET"
fi
g bucket allow --read --write --owner "$S3_BUCKET" --key "$S3_ACCESS_KEY_ID"

echo "==> Done"
g bucket info "$S3_BUCKET"

