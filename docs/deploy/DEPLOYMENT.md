# Deploying CAFFT-IA: pre and pro on the UIB server

CAFFT-IA is a single-page app backed by a small API (`server/`, see
`docs/backend/PLAN.md`) that keeps accounts and clinical data in SQLite. Each
environment runs two containers: `<prefix>-nginx` serves the app and proxies to
`<prefix>-api`. nginx also proxies Gemini, so the API key never reaches the
browser, and only for logged-in users.

| Environment | URL | Branch | Clone on the server | Containers |
|---|---|---|---|---|
| **pre** (tests, no real patients) | <https://pausat-pre.uib.es/cafft/> | `pre` | `/data/apps/cafft-pre` | `cafft-pre-nginx`, `cafft-pre-api` |
| **pro** (the pilot) | <https://pausat.uib.es/cafft/> | `pro` | `/data/apps/cafft-pro` | `cafft-nginx`, `cafft-api` |

Both are reachable only through the UIB VPN. `pro` keeps the compose project
`cafft` and the container names that `server-monitoring` watches.

---

## How a change reaches the server

Three permanent branches, as in PAUSAT and B4B: work lands in **`dev`**, a pull
request `dev → pre` deploys it to **pre** for the team to review, and a pull
request `pre → pro` deploys it to **pro**.

```
 PR into dev ──► CI (tests)                       .github/workflows/ci.yml
 dev ──PR──► pre ──► guard + tests ──► deploy.sh pre   .github/workflows/deploy.yml
 pre ──PR──► pro ──► guard + tests ──► deploy.sh pro
```

- **Guard:** a push to `pre` may only bring commits that are already in `dev`,
  and a push to `pro` only commits already in `pre`. Branch protection is not
  available for a private repository on the Free plan, so the workflow checks it
  and, locally, `scripts/git-hooks/pre-push` (enable it once per clone with
  `git config core.hooksPath scripts/git-hooks`). The hook also refuses to
  delete `dev`, `pre` or `pro`, and runs the type check and the API tests.
- **Tests** run on GitHub's machines: type check, API tests and the end-to-end
  run (`npm run test:e2e`).
- **Deploy** runs on a self-hosted runner installed **on the server** (label
  `cafft`): the server is only reachable through the VPN, so GitHub cannot
  reach it, but the runner can reach GitHub. It runs `deploy.sh` from the
  pushed commit.

`deploy.sh <pre|pro>`, in the environment's clone:

1. silences the app's alerts for 10 minutes (`silencio-deploy cafft <env>`);
2. `git fetch` and a fast-forward to the branch (stops if someone edited
   tracked files by hand);
3. builds the app in a `node:24-alpine` container — the server has no Node —
   and fails if the build references a host the CSP blocks;
4. swaps the build into `runtime/web/cafft` with an atomic rename;
5. `docker compose up -d --build` (nginx is recreated when its config changed);
6. waits for the API to be healthy and checks `/cafft/api/health` **through
   Traefik**, by its body: without CAFFT's router, PAUSAT answers that URL with
   its own page and a misleading 200.

The API snapshots the database every time it starts, before migrating, so every
deploy leaves a copy of the data as it was before the new code touched it.

### Layout of an environment

```
/data/apps/cafft-<env>/          clone of the repository, branch <env>
├── .env.<env>                   host, names, mail (deploy/env.example) — not in git
├── deploy.sh
├── deploy/compose.yml           the stack
├── deploy/nginx/cafft.conf      nginx config, including the Gemini proxy
└── runtime/                     not in git
    ├── web/cafft/               the built app (deploy.sh swaps it in)
    ├── videos/                  the exposure videos (mp4)
    ├── secrets/gemini-key.conf  the Gemini key (0600)
    ├── data/                    the SQLite database   — owned by uid 1000
    └── backups/                 daily snapshots       — owned by uid 1000
```

Traefik (`edge-traefik-1`, shared with PAUSAT and B4B) routes
`Host(<host>) && PathPrefix(/cafft)` to the environment's nginx with priority
100, above PAUSAT's routers for the same host, which match on `Host` alone. The
certificates of `pausat.uib.es` and `pausat-pre.uib.es` are already declared in
`/data/apps/edge/dynamic/pausat.yml` and chosen by SNI.

---

## Routine

- **Deploy to pre:** open a pull request `dev → pre` and merge it.
- **Deploy to pro:** open a pull request `pre → pro` and merge it.
- **Re-run a deploy** (e.g. a push that did not trigger it): GitHub → Actions →
  Deploy → *Run workflow* → choose `pre` or `pro`. It goes through the guard
  and the tests like a push.
- **Deploy by hand, in an emergency** (the runner is down): on the server,
  `bash /data/apps/cafft-pro/deploy.sh pro`.

### Rolling back

Revert on `dev`, then promote the revert as usual (`dev → pre → pro`): the
guard accepts it like any other change, and the server ends up with the
previous code. Do not `git checkout` an old commit in a clone: the next deploy
would undo it, and `deploy.sh` stops on a clone whose branch has moved.

A schema migration is not undone by a revert. To go back to the data as it was
before a deploy, restore the snapshot the API took when it started (see
[Backups](#backups)).

---

## Provisioning an environment (once)

These steps set up `pre` from nothing. They are also the first half of the move
of `pro` (next section).

### 1. Access to the repository: a read-only deploy key

The clones pull from the private repository with their own key, as B4B, Video
Studio and the newsletter do:

```bash
ssh-keygen -t ed25519 -N '' -C 'ebp cafft deploy' -f ~/.ssh/cafft_deploy
cat >> ~/.ssh/config <<'EOF'
Host github-cafft
    HostName github.com
    IdentityFile ~/.ssh/cafft_deploy
    IdentitiesOnly yes
EOF
cat ~/.ssh/cafft_deploy.pub
```

Add the public key to GitHub → repository → Settings → Deploy keys, **without**
write access. Then `ssh -T git@github-cafft` must greet the repository.

### 2. The runner

GitHub → repository → Settings → Actions → Runners → *New self-hosted runner*
→ Linux x64 gives the download URL and a registration token (valid for an
hour). On the server, as `marco` (in the `docker` group):

```bash
mkdir -p ~/actions-runner-cafft && cd ~/actions-runner-cafft
curl -o runner.tar.gz -L <URL given by GitHub>
tar xzf runner.tar.gz
./config.sh --url https://github.com/marcomartinez-fueib/CAFFT-IA --token <TOKEN> \
            --name ebp-cafft --labels self-hosted,cafft --unattended
sudo ./svc.sh install && sudo ./svc.sh start
```

The `cafft` label is required: the deploy job runs on `[self-hosted, cafft]`.
GitHub must show the runner as *Idle*.

Security: the runner executes workflow code on the server. The repository is
private and the deploy workflow only runs on pushes to `pre` and `pro`; never
let it run on pull requests from forks.

### 3. GitHub environments

Settings → Environments: `pre` and `pro` (the deploy job uses the branch name as
the environment). No required reviewers: a merge into `pro` deploys as soon as
the guard and the tests pass.

### 4. The clone, its settings and runtime/

For `pre`:

```bash
git clone -b pre git@github-cafft:marcomartinez-fueib/CAFFT-IA.git /data/apps/cafft-pre
cd /data/apps/cafft-pre
cp deploy/env.example .env.pre        # then fill in the pre block
mkdir -p runtime/{web,videos,secrets,data,backups}
# The API image runs as uid 1000 (`node`); marco is uid 1000 on this server.
chown 1000:1000 runtime/data runtime/backups
chmod 700 runtime/data runtime/backups runtime/secrets
```

The Gemini key: a file with exactly one line,
`proxy_set_header X-Goog-Api-Key "AIza...";`, mode `0600`, in
`runtime/secrets/gemini-key.conf`. The exposure videos: copy them into
`runtime/videos/`.

### 5. First deploy and the first account

`bash deploy.sh pre`, or push to `pre` and let the runner do it. The app ships
no accounts; create the first superadmin (it asks for the password without
echoing it):

```bash
docker exec -it cafft-pre-api node src/cli/create-admin.ts --username <name> --email <address>
```

`pre` holds **only test accounts and test patients**, never real people. Its
mail goes only to `MAIL_ALLOWED_DOMAINS` (`uib.es`, `uib.cat`, `fueib.org`);
anything else is written to the API log and recorded as suppressed.

---

## Moving pro out of /data/apps/cafft (once, 2026-11)

Until November 2026 production ran from `/data/apps/cafft`, deployed from a
laptop with a script that copied files over SSH. The move to
`/data/apps/cafft-pro` keeps the data, the URL, the compose project and the
container names. The old directory is left untouched as the way back.

1. Provision `cafft-pro` as above (deploy key and runner are shared) with
   `.env.pro`, **without deploying**: the `pro` branch must not get the new
   deploy workflow until the data is in place.
2. Stop the old stack and copy everything while the API is down, so the
   database is consistent:

   ```bash
   /data/apps/monitoring/bin/silencio-deploy cafft pro
   cd /data/apps/cafft && docker compose down
   cp -a /data/apps/cafft/{data,backups,videos,secrets,web} /data/apps/cafft-pro/runtime/
   ```

3. Merge `pre → pro`: the runner deploys the new stack on the copied data.
4. Check it (below). If it fails, go back:

   ```bash
   cd /data/apps/cafft-pro && docker compose --env-file .env.pro -f deploy/compose.yml down
   cd /data/apps/cafft && docker compose up -d
   ```

5. Once it has run a few days, delete `/data/apps/cafft`. `server-monitoring`
   must point at the new paths first (`/data/apps/cafft-pro/runtime/backups`
   and the disk inventory): otherwise `BackupAntiguo` fires 26 hours after the
   move.

---

## Verification

### From the server

```bash
B=https://pausat-pre.uib.es       # or https://pausat.uib.es for pro

curl -sS $B/cafft/api/health                              # {"status":"ok"}
curl -sS -o /dev/null -w '/cafft/ -> %{http_code}\n' $B/cafft/
curl -sS -o /dev/null -w '/       -> %{http_code}   (PAUSAT must still work)\n' $B/
curl -sSI $B/cafft | grep -iE '^HTTP/|^location'          # 301 -> /cafft/

# The decisive check: are these OUR hashed assets, or PAUSAT's catch-all?
curl -sS $B/cafft/ | grep -oE '(src|href)="/cafft/assets/[^"]+"'

curl -sSI $B/cafft/ | grep -iE 'cache-control|content-security-policy'
curl -sS -o /dev/null -w 'genai -> %{http_code}\n' $B/cafft/genai/v1beta/models   # 401 without a session
curl -sS -o /dev/null -w 'range -> %{http_code}  (206)\n' \
     -H 'Range: bytes=0-1023' $B/cafft/videos_cafft/ev001_es.mp4
curl -sS -o /dev/null -w 'listing -> %{http_code}  (403)\n' $B/cafft/videos_cafft/
```

The hashed-asset grep and PAUSAT's `/` still returning 200 matter most: the
first proves it is CAFFT's build, the second that nothing of PAUSAT broke.

### In the browser

With devtools open; **any CSP violation means a feature is silently dead.**

- [ ] The page renders with the UIB fonts and colours
- [ ] The console shows **zero** `Content-Security-Policy` violations
- [ ] No requests to `cdn.tailwindcss.com`, `fonts.googleapis.com`, `youtube.com` or `github.com`
- [ ] Logging in, the QPV-II and the exposure screen work; a video plays and cannot be paused or seeked
- [ ] The AI chat replies
- [ ] PAUSAT itself still works on the same host

### If the AI chat does not reply

```bash
curl -s -o /dev/null -w '%{http_code}\n' 'https://pausat.uib.es/cafft/genai/v1beta/models'
```

- `401` without a session is expected; from the logged-in browser it should be `200`.
- `403` — the key is wrong, or the Gemini API is not enabled for it.
- `404` — the `location /cafft/genai/` block is missing.
- `429` — the rate limit (20 requests/minute per IP) is doing its job.
- `502` — nginx cannot reach Google; `docker restart <prefix>-nginx` re-resolves it.

### If the page renders unstyled

The stylesheet did not load: check `runtime/web/cafft/assets/` and
`docker logs <prefix>-nginx`.

---

## Backups

The API snapshots the database to `runtime/backups/cafft-YYYY-MM-DD.db` every
time it starts (before migrating) and once a day after that, and deletes
snapshots older than 30 days. One on demand:

```bash
docker exec cafft-api node src/cli/backup.ts
```

To restore, stop the API, put a snapshot in place of the database and start it
again; remove the `-wal`/`-shm` files, which belong to the database being
replaced:

```bash
cd /data/apps/cafft-pro
docker stop cafft-api
cp runtime/backups/cafft-2026-11-03.db runtime/data/cafft.db
rm -f runtime/data/cafft.db-wal runtime/data/cafft.db-shm
chown 1000:1000 runtime/data/cafft.db
docker start cafft-api
```

If nginx returns 502 for `/cafft/api/*`, the API is down (`docker logs cafft-api`);
the rest of the site keeps working, because nginx resolves `api` per request.

---

## Email through the UIB relay

Password-reset links, invitations, reminders and the in-app feedback (to
`FEEDBACK_TO`) go out through the university's relay, as B4B and PAUSAT do from
this server:

| Setting | Value |
|---|---|
| Relay | `smtp.uib.es`, port 25 |
| Encryption | STARTTLS, required |
| Authentication | none: the relay accepts mail by the server's IP |
| Sender | `MAIL_FROM` in the env file (`CAFFT <cafft@uib.es>`) |

Emails go into a queue in the database (`outbound_mail`) and are sent every 30
seconds; failures are retried after 1 min, 5 min, 30 min, 2 h and 6 h. To see
what has not gone out, and the relay's answer for what has (its queue id lets
the UIB's IT service trace a message):

```bash
docker exec cafft-api node -e "const {DatabaseSync}=require('node:sqlite'); console.table(new DatabaseSync('/data/cafft.db',{readOnly:true}).prepare(\"SELECT id, to_address, kind, attempts, last_error, relay_response FROM outbound_mail ORDER BY id DESC LIMIT 20\").all())"
```

**The `cafft@uib.es` mailbox** should exist so that bounces are not lost; ask
the UIB's IT service for it and check that the relay signs with DKIM for
`uib.es` (pending).

---

## Monitoring

`server-monitoring` watches pro: `https://pausat.uib.es/cafft/api/health`
(it must answer `"status":"ok"`), the containers `cafft-nginx` and `cafft-api`,
the age of the newest backup and the disk used by the environment. `deploy.sh`
silences the app's alerts while it runs. The health requests are left out of
the nginx access log and the API log.

---

## Why the app is built the way it is

`pausat.uib.es` sends a strict Content-Security-Policy
(`default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; …`),
so the app needs no exceptions: Tailwind is compiled at build time, the fonts
are self-hosted, Gemini is called through `/cafft/genai/` with the key injected
by nginx, and every video is served from `/cafft/videos_cafft/`. `deploy.sh`
refuses a build that references a CDN the policy would block.

**The Gemini proxy requires a session:** nginx checks the session cookie with
the API (`auth_request`) before forwarding to Google, and limits each IP to 20
requests per minute. **Patient data lives only in the API's database**; the
browser keeps a copy in memory while the app is open, plus the language
preference in `localStorage`. **There are no built-in accounts**: the first
superadmin is created with `create-admin`.

The base path `/cafft/` is a build-time constant (Vite bakes it into asset
URLs). To serve elsewhere, build with `BASE_PATH`, and change the paths in
`deploy/nginx/cafft.conf` and the `PathPrefix` in `deploy/compose.yml`.
