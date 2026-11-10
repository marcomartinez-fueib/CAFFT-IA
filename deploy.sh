#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# deploy.sh — deploys one CAFFT environment on the UIB server.
# ---------------------------------------------------------------------------
# Run by the self-hosted runner (.github/workflows/deploy.yml) on a push to
# `pre` or `pro`; can also be run by hand on the server:
#
#     bash deploy.sh <pre|pro>
#
#   pre → /data/apps/cafft-pre  (branch pre)  ·  .env.pre  ·  https://pausat-pre.uib.es/cafft/
#   pro → /data/apps/cafft-pro  (branch pro)  ·  .env.pro  ·  https://pausat.uib.es/cafft/
#
# The directory is a clone of the repository with the env file (see
# deploy/env.example) and runtime/ (data, backups, videos, secrets, web), which
# git ignores. Steps: update the clone, build the app in a Node container,
# swap it into runtime/web/cafft at once, rebuild and restart the containers,
# and check the API through Traefik. The API backs the database up every time
# it starts, before migrating, so each deploy leaves a snapshot behind.
#
# Runbook: docs/deploy/DEPLOYMENT.md
# ---------------------------------------------------------------------------
set -euo pipefail

TARGET="${1:-}"
case "$TARGET" in
    pre|pro) ;;
    *) echo "[deploy] ERROR: usage: deploy.sh <pre|pro>" >&2; exit 2 ;;
esac

DEPLOY_DIR="${DEPLOY_DIR:-/data/apps/cafft-$TARGET}"
ENV_FILE=".env.$TARGET"
NODE_IMAGE="node:24-alpine"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"

echo "[deploy] environment: $TARGET | directory: $DEPLOY_DIR"
[ -d "$DEPLOY_DIR" ] || { echo "[deploy] ERROR: $DEPLOY_DIR does not exist (environment not provisioned? see docs/deploy/DEPLOYMENT.md)" >&2; exit 1; }
cd "$DEPLOY_DIR"
[ -f "$ENV_FILE" ] || { echo "[deploy] ERROR: $DEPLOY_DIR/$ENV_FILE is missing (see deploy/env.example)" >&2; exit 1; }

CAFFT_HOST="$(grep -E '^CAFFT_HOST=' "$ENV_FILE" | cut -d= -f2- | tr -d '[:space:]')"
[ -n "$CAFFT_HOST" ] || { echo "[deploy] ERROR: CAFFT_HOST is empty in $ENV_FILE" >&2; exit 1; }

compose() {
    docker compose --env-file "$ENV_FILE" -f deploy/compose.yml "$@"
}

# Silence the app's alerts for 10 minutes while containers are recreated
# (server-monitoring knows the pairs `cafft pro` and `cafft pre`).
# Never fails the deploy if monitoring is down.
if [ -x /data/apps/monitoring/bin/silencio-deploy ]; then
    /data/apps/monitoring/bin/silencio-deploy cafft "$TARGET" || true
fi

# ---------------------------------------------------------------------------
# 1. Update the clone
# ---------------------------------------------------------------------------
git fetch origin
# Local edits to tracked files (a manual hotfix) would be overwritten: stop.
# Untracked files (the env file, runtime/) do not block.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "[deploy] ERROR: uncommitted changes in $DEPLOY_DIR:" >&2
    git status --short --untracked-files=no >&2
    exit 1
fi
git checkout "$TARGET"
# From what was just fetched: one trip to GitHub per deploy, not two.
git merge --ff-only "origin/$TARGET"
echo "[deploy] HEAD: $(git rev-parse --short HEAD) — $(git log -1 --format=%s)"

# ---------------------------------------------------------------------------
# 2. Build the app (no Node on the host: a throwaway container does it)
# ---------------------------------------------------------------------------
# As the deploy user, so the files it writes in the clone stay theirs. The npm
# cache is a directory of that user (a named volume would be root-owned),
# kept between deploys.
echo "[deploy] building the app in $NODE_IMAGE..."
rm -rf dist
NPM_CACHE="$HOME/.cache/cafft-npm"
mkdir -p "$NPM_CACHE"
docker run --rm \
    --user "$(id -u):$(id -g)" \
    -e HOME=/tmp -e npm_config_cache=/npm-cache \
    -v "$NPM_CACHE:/npm-cache" \
    -v "$DEPLOY_DIR:/app" -w /app \
    "$NODE_IMAGE" sh -c 'npm ci --no-audit --no-fund && npm run build'
[ -f dist/index.html ] || { echo "[deploy] ERROR: the build produced no dist/index.html" >&2; exit 1; }

# The exposure videos live in runtime/videos; the copies in public/ are Git LFS
# pointers that must never replace them.
rm -rf dist/videos_cafft

# Fail loudly if the build references a CDN the server's CSP blocks: it would
# fail silently in the browser.
BLOCKED=0
for host in cdn.tailwindcss.com fonts.googleapis.com fonts.gstatic.com img.youtube.com youtube.com/embed storage.googleapis.com; do
    if grep -rq "$host" dist/assets/ 2>/dev/null; then
        echo "[deploy] ERROR: the build references $host, which the CSP blocks" >&2
        BLOCKED=1
    fi
done
[ "$BLOCKED" -eq 0 ] || exit 1

# ---------------------------------------------------------------------------
# 3. Swap the app in at once
# ---------------------------------------------------------------------------
# Same filesystem, so the renames are atomic, and the whole tree is replaced,
# which drops the hashed assets of previous builds.
mkdir -p runtime/web
rm -rf runtime/web/.cafft-new runtime/web/.cafft-old
mv dist runtime/web/.cafft-new
[ -d runtime/web/cafft ] && mv runtime/web/cafft runtime/web/.cafft-old
mv runtime/web/.cafft-new runtime/web/cafft
rm -rf runtime/web/.cafft-old
echo "[deploy] app swapped into runtime/web/cafft"

# ---------------------------------------------------------------------------
# 4. Rebuild and restart the containers
# ---------------------------------------------------------------------------
NGINX_CONF_SHA256="$(sha256sum deploy/nginx/cafft.conf | cut -d' ' -f1)"
export NGINX_CONF_SHA256
compose up -d --build

echo "[deploy] waiting for the API to be healthy (up to ${HEALTH_TIMEOUT}s)..."
deadline=$(( $(date +%s) + HEALTH_TIMEOUT ))
status=unknown
while true; do
    api_id="$(compose ps -q api 2>/dev/null || true)"
    [ -n "$api_id" ] && status="$(docker inspect --format '{{.State.Health.Status}}' "$api_id" 2>/dev/null || echo unknown)"
    [ "$status" = healthy ] && break
    if [ "$(date +%s)" -ge "$deadline" ]; then
        echo "[deploy] ERROR: the API did not become healthy (last status: $status). Last log lines:" >&2
        compose logs --tail 100 api >&2 || true
        exit 1
    fi
    sleep 5
done

# ---------------------------------------------------------------------------
# 5. Check through Traefik, as a browser would
# ---------------------------------------------------------------------------
# The body, not just the status: without the CAFFT router, PAUSAT answers this
# URL with its own index.html and a misleading 200.
HEALTH=""
for _ in $(seq 1 15); do
    HEALTH="$(curl -s --max-time 10 --resolve "$CAFFT_HOST:443:127.0.0.1" "https://$CAFFT_HOST/cafft/api/health" || true)"
    [[ "$HEALTH" == *'"status":"ok"'* ]] && break
    sleep 2
done
if [[ "$HEALTH" != *'"status":"ok"'* ]]; then
    echo "[deploy] ERROR: https://$CAFFT_HOST/cafft/api/health is not the CAFFT API (got: ${HEALTH:0:80})" >&2
    exit 1
fi
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 --resolve "$CAFFT_HOST:443:127.0.0.1" "https://$CAFFT_HOST/cafft/")"
[ "$CODE" = 200 ] || { echo "[deploy] ERROR: https://$CAFFT_HOST/cafft/ answered $CODE" >&2; exit 1; }
echo "[deploy] https://$CAFFT_HOST/cafft/ is up and the API answers"

# Successive --build runs leave dangling images behind.
docker image prune -f >/dev/null
echo "[deploy] done: $TARGET at $(git rev-parse --short HEAD)"
