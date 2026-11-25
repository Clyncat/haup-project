#!/usr/bin/env bash
# Smoke test for the infra stack. Run after: docker compose up -d && ./scripts/garage-init.sh
# Usage: ./scripts/smoke-test.sh            # local checks only
#        ./scripts/smoke-test.sh --public   # also test through Cloudflare (https://s3.liu-shu.com)
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

S3_PUBLIC="https://s3.liu-shu.com"
APP_HOST="app.liu-shu.com"
PASS=0; FAIL=0
ok()   { echo "  ✅ $*"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $*"; FAIL=$((FAIL+1)); }

# aws-cli in a throwaway container (no install needed on the host)
aws() {
  docker run --rm --network host -v "$TMP:/work" -w /work \
    -e AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
    -e AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
    -e AWS_DEFAULT_REGION=garage \
    amazon/aws-cli "$@" 2>&1
}
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

echo "== 0. Pull aws-cli image (first run only)"
docker image inspect amazon/aws-cli >/dev/null 2>&1 || docker pull -q amazon/aws-cli

echo "== 1. Containers healthy (waiting up to 90s)"
for s in traefik garage postgres client service; do
  st=""
  for _ in $(seq 1 45); do
    st=$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q $s)" 2>/dev/null)
    [[ "$st" == healthy || "$st" == unhealthy ]] && break
    sleep 2
  done
  [[ "$st" == healthy ]] && ok "$s: $st" || fail "$s: ${st:-not running}"
done

echo "== 2. PostgreSQL"
if v=$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
      "create table if not exists _smoke(id int); insert into _smoke values (1); select count(*) from _smoke; drop table _smoke;" 2>&1); then
  ok "read/write works"
else
  fail "psql: $v"
fi
docker compose exec -T postgres psql -U "$POSTGRES_USER" -tAc "select version()" | head -1 | sed 's/^/     /'

echo "== 3. Garage S3 (direct 127.0.0.1:3900)"
EP="--endpoint-url http://127.0.0.1:3900"
echo "hello-$(date +%s)" > "$TMP/hello.txt"
aws $EP s3 cp hello.txt "s3://$S3_BUCKET/_smoke/hello.txt" >/dev/null && ok "upload" || fail "upload"
aws $EP s3 cp "s3://$S3_BUCKET/_smoke/hello.txt" got.txt >/dev/null && cmp -s "$TMP/hello.txt" "$TMP/got.txt" \
  && ok "download matches" || fail "download"

echo "== 4. Traefik routing (127.0.0.1:8081)"
[[ $(curl -s http://127.0.0.1:8080/ping) == OK ]] && ok "ping" || fail "ping"
code=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: s3.liu-shu.com" http://127.0.0.1:8081/)
[[ "$code" =~ ^(200|403)$ ]] && ok "s3.liu-shu.com → garage (HTTP $code)" || fail "s3 route HTTP $code"
# Apps aren't running yet, so 502 = route exists but backend down (expected)
for p in / /api; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $APP_HOST" "http://127.0.0.1:8081$p")
  [[ "$code" != 404 ]] && ok "$APP_HOST$p routed (HTTP $code; 502 = app not started yet)" \
                        || fail "$APP_HOST$p not routed (404)"
done

if [[ "${1:-}" == --public ]]; then
  echo "== 5. Public via Cloudflare Tunnel"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$S3_PUBLIC/")
  [[ "$code" =~ ^(200|403)$ ]] && ok "$S3_PUBLIC reachable (HTTP $code)" || fail "$S3_PUBLIC HTTP $code"
  # Presigned URL signed for the public host — proves Host header passes through intact
  url=$(aws --endpoint-url "$S3_PUBLIC" s3 presign "s3://$S3_BUCKET/_smoke/hello.txt" --expires-in 60 | tail -1)
  [[ "$(curl -s "$url")" == "$(cat "$TMP/hello.txt")" ]] && ok "presigned URL download" || fail "presigned URL"
fi

aws --endpoint-url http://127.0.0.1:3900 s3 rm --recursive "s3://$S3_BUCKET/_smoke/" >/dev/null

echo
echo "Result: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
