#!/usr/bin/env bash
#
# Deploys CAFFT-IA to the on-premise server at https://pausat.uib.es/cafft/
#
# Run from the repository root. On Windows use Git Bash.
#
#   ./docs/deploy/deploy.sh              # build + deploy the app
#   ./docs/deploy/deploy.sh --videos     # also upload public/videos_cafft/
#   ./docs/deploy/deploy.sh --dry-run    # build and show what would happen
#
# Configure by exporting these (or editing the defaults):
#
#   CAFFT_SSH_TARGET   ssh destination, e.g. marco@pausat.uib.es
#   CAFFT_APP_DIR      where the built app lives on the server
#   CAFFT_VIDEO_DIR    where the mp4 assets live on the server
#   CAFFT_SUDO         set to "sudo" if the deploy user cannot write those dirs
#
# The app is uploaded to a temporary directory and swapped into place, so a
# failed upload cannot leave the site half-updated.
#
# The defaults below match the containerised deployment in docs/deploy/docker/:
# the app directory sits INSIDE the bind-mounted `web` directory, so the atomic
# rename happens under a mount that stays valid, and cafft-nginx picks the new
# build up immediately with no restart.

set -euo pipefail

SSH_TARGET="${CAFFT_SSH_TARGET:-}"
APP_DIR="${CAFFT_APP_DIR:-/data/apps/cafft/web/cafft}"
VIDEO_DIR="${CAFFT_VIDEO_DIR:-/data/apps/cafft/videos}"
SUDO="${CAFFT_SUDO:-}"

WITH_VIDEOS=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --videos)  WITH_VIDEOS=1 ;;
    --dry-run) DRY_RUN=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

if [[ -z "$SSH_TARGET" ]]; then
  echo "ERROR: set CAFFT_SSH_TARGET, e.g." >&2
  echo "  export CAFFT_SSH_TARGET=youruser@pausat.uib.es" >&2
  exit 2
fi

cd "$(dirname "$0")/../.."
echo "==> repository: $(pwd)"

# ---------------------------------------------------------------------------
# 1. Build
# ---------------------------------------------------------------------------
# No GEMINI_API_KEY is needed at build time: the key lives only in the nginx
# config on the server. A build that embedded a key would leak it to every
# visitor, which is exactly what this deployment avoids.
echo "==> installing dependencies (npm ci)"
npm ci

echo "==> building for base path /cafft/"
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "ERROR: build produced no dist/index.html" >&2
  exit 1
fi

# Fail loudly if the build still references a CDN the server's CSP will block.
echo "==> checking the build for CSP-blocked external references"
BLOCKED=0
for host in cdn.tailwindcss.com fonts.googleapis.com fonts.gstatic.com \
            img.youtube.com youtube.com/embed storage.googleapis.com; do
  if grep -rq "$host" dist/assets/ 2>/dev/null; then
    echo "  BLOCKED REFERENCE: $host" >&2
    BLOCKED=1
  fi
done
if [[ "$BLOCKED" -ne 0 ]]; then
  echo "ERROR: the build references external hosts the CSP forbids." >&2
  echo "       Fix these before deploying — they would fail silently in the browser." >&2
  exit 1
fi
echo "  none found"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo
  echo "==> dry run, nothing uploaded. Would deploy:"
  echo "      app    -> $SSH_TARGET:$APP_DIR"
  [[ "$WITH_VIDEOS" -eq 1 ]] && echo "      videos -> $SSH_TARGET:$VIDEO_DIR"
  du -sh dist
  exit 0
fi

# ---------------------------------------------------------------------------
# 2. Upload the app and swap it into place
# ---------------------------------------------------------------------------
# videos_cafft is excluded: the video assets live outside the app directory so
# that redeploying never re-uploads gigabytes of clinical video.
#
# The staging directory is created alongside the target rather than in /tmp so
# the final `mv` is a same-filesystem rename. That makes the swap atomic and
# replaces the whole tree at once, which also drops hashed assets from previous
# builds instead of letting them accumulate forever.
echo "==> uploading the app to $SSH_TARGET:$APP_DIR"

tar czf - -C dist --exclude=videos_cafft . \
  | ssh "$SSH_TARGET" "
      set -eu
      APP='$APP_DIR'
      STAGING=\"\$(dirname \"\$APP\")/.cafft-deploy-\$\$\"
      OLD=\"\$(dirname \"\$APP\")/.cafft-old-\$\$\"

      $SUDO mkdir -p \"\$STAGING\"
      $SUDO tar xzf - -C \"\$STAGING\"

      $SUDO mkdir -p \"\$(dirname \"\$APP\")\"
      if [ -d \"\$APP\" ]; then
        $SUDO mv \"\$APP\" \"\$OLD\"
      fi
      $SUDO mv \"\$STAGING\" \"\$APP\"
      $SUDO rm -rf \"\$OLD\"
    "
echo "  app uploaded"

# ---------------------------------------------------------------------------
# 3. Upload the videos (only with --videos)
# ---------------------------------------------------------------------------
if [[ "$WITH_VIDEOS" -eq 1 ]]; then
  echo "==> uploading videos to $SSH_TARGET:$VIDEO_DIR"
  if ! compgen -G "public/videos_cafft/*.mp4" > /dev/null; then
    echo "ERROR: no .mp4 files in public/videos_cafft/" >&2
    echo "       See public/videos_cafft/PLACE_VIDEOS_HERE.txt for the file list." >&2
    exit 1
  fi
  if ! command -v rsync >/dev/null 2>&1; then
    echo "ERROR: rsync is required to upload videos (it skips files already on" >&2
    echo "       the server, which matters for multi-gigabyte assets)." >&2
    echo "       Git Bash on Windows does not ship it — install rsync, or copy" >&2
    echo "       public/videos_cafft/* to $VIDEO_DIR by hand (scp/WinSCP)." >&2
    exit 1
  fi

  ssh "$SSH_TARGET" "$SUDO mkdir -p '$VIDEO_DIR'"

  # Build the option list as an array: an unquoted ${VAR:+--opt="a b"} would
  # word-split on the space and pass two broken arguments.
  RSYNC_OPTS=(-av --progress --include='*.mp4' --include='*.jpg' --exclude='*')
  if [[ -n "$SUDO" ]]; then
    RSYNC_OPTS+=(--rsync-path="$SUDO rsync")
  fi

  # No --delete here: never remove clinical assets as a side effect of a deploy.
  rsync "${RSYNC_OPTS[@]}" public/videos_cafft/ "$SSH_TARGET:$VIDEO_DIR/"
  echo "  videos uploaded"
fi

# ---------------------------------------------------------------------------
# 4. Verify
# ---------------------------------------------------------------------------
echo "==> verifying https://pausat.uib.es/cafft/"
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 https://pausat.uib.es/cafft/)
echo "  GET /cafft/ -> HTTP $CODE"

ASSET=$(grep -oE 'src="/cafft/assets/[^"]+"' dist/index.html | head -1 | sed 's/src="//;s/"//')
if [[ -n "$ASSET" ]]; then
  ACODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://pausat.uib.es$ASSET")
  echo "  GET $ASSET -> HTTP $ACODE"
fi

echo
echo "Done. Now walk through the checklist in docs/deploy/DEPLOYMENT.md"
echo "(open the browser console and confirm there are no CSP violations)."
