#!/usr/bin/env bash
# Generate .env from .env.example with random secrets.
# Safe to run: refuses to overwrite an existing .env.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  echo ".env already exists — not overwriting" >&2
  exit 1
fi

cp .env.example .env
sed -i \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" \
  -e "s|^GARAGE_RPC_SECRET=.*|GARAGE_RPC_SECRET=$(openssl rand -hex 32)|" \
  -e "s|^GARAGE_ADMIN_TOKEN=.*|GARAGE_ADMIN_TOKEN=$(openssl rand -base64 32)|" \
  -e "s|^GARAGE_METRICS_TOKEN=.*|GARAGE_METRICS_TOKEN=$(openssl rand -base64 32)|" \
  -e "s|^S3_ACCESS_KEY_ID=.*|S3_ACCESS_KEY_ID=GK$(openssl rand -hex 12)|" \
  -e "s|^S3_SECRET_ACCESS_KEY=.*|S3_SECRET_ACCESS_KEY=$(openssl rand -hex 32)|" \
  .env
chmod 600 .env  # secrets: owner read/write only

set -a; source .env; set +a
cat <<EOF
.env created — copy these values into service/.env:

DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}
S3_ENDPOINT=http://127.0.0.1:3900
S3_PUBLIC_ENDPOINT=https://s3.liu-shu.com
S3_REGION=garage
S3_FORCE_PATH_STYLE=true
S3_BUCKET=${S3_BUCKET}
S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
EOF

