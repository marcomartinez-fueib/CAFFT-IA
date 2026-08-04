# Deploying CAFFT-IA to https://pausat.uib.es/cafft/

CAFFT-IA is a static single-page app. There is no backend and no database — all
patient data lives in the browser's `localStorage`. Deploying it means copying a
directory of files onto the server and starting one small container.

The one moving part is the Gemini proxy, which exists so the API key never
reaches the browser.

---

## How this fits on the server

`pausat.uib.es` has **no nginx on the host**. The only process bound to ports 80
and 443 is `edge-traefik-1`; the site itself is served by the `pausat-pro-nginx-1`
container, built from a private image. Traefik routes by container labels
(`--providers.docker.exposedbydefault=false`, network `edge`).

CAFFT therefore runs as **its own nginx container**, and Traefik sends it
everything matching `Host(pausat.uib.es) && PathPrefix(/cafft)`. Everything else
on that host keeps going to PAUSAT.

```
                          ┌── PathPrefix(/cafft) ──> cafft-nginx  (this deployment)
:443 ── edge-traefik-1 ───┤
                          └── everything else ─────> pausat-pro-nginx-1  (untouched)
```

The alternative — adding `location` blocks to PAUSAT's nginx — was rejected: it
means editing a config baked into someone else's image and restarting their
production web server in order to ship ours.

Layout on the server, all under one directory owned by the deploy user:

```
/data/apps/cafft/
├── docker-compose.yml          the container and its Traefik labels
├── nginx/cafft.conf            nginx config, including the Gemini proxy
├── web/cafft/                  the built app        <- deploy.sh writes here
├── videos/                     the mp4 assets
└── secrets/gemini-key.conf     the Gemini key (0600)
```

> **Why `web/cafft/` and not just `web/`:** the app sits in a subdirectory of its
> own document root so the nginx locations can use `root` instead of `alias` —
> `alias` combined with `try_files` is a long-standing source of subtly broken
> configs. The container mounts the **parent** (`web`), which also matters; see
> the note in `docker-compose.yml`.

---

## Before you start

| | |
|---|---|
| UIB VPN | `pausat.uib.es` resolves to `172.30.248.152`, a private address. Without the VPN there is no SSH and no browser access. |
| SSH access | to `pausat.uib.es`, able to write `/data/apps/` — no `sudo` needed |
| A Gemini API key | stored only on the server, never in the build |
| The video files | see [`public/videos_cafft/PLACE_VIDEOS_HERE.txt`](../../public/videos_cafft/PLACE_VIDEOS_HERE.txt) for the exact filenames |
| Node.js 20+ and `npm` | on the machine you build from |
| Git Bash | on Windows — `deploy.sh` is a bash script. Running `./deploy.sh` from PowerShell silently opens it by file association and does nothing. |

---

## Why the app had to change to run here

`pausat.uib.es` sends a strict Content-Security-Policy:

```
default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; ...
```

CAFFT-IA previously depended on six things that policy forbids. Rather than
punching holes in the site's security policy, the app was changed to need no
exceptions at all:

| Was | Now |
|---|---|
| Tailwind loaded from `cdn.tailwindcss.com` + an inline `<script>` config | Tailwind compiled at build time; theme in `tailwind.config.js` |
| Google Fonts stylesheet | fonts self-hosted via `@fontsource-variable/*`, bundled into the build |
| An inline `<style>` block in `index.html` | moved to `index.css` |
| Gemini called directly from the browser, key embedded in the JS bundle | called through `/cafft/genai/`, key injected by nginx |
| Exposure videos from GitHub Releases, plus external CDN fallbacks | served from `/cafft/videos_cafft/` |
| YouTube `<iframe>` on the intro page | self-hosted `<video>` |

A side effect worth stating plainly: **the Gemini API key used to be readable by
anyone who opened devtools on the Vercel deployment.** If that key is still in
use, treat it as compromised and rotate it before deploying.

---

## Step 1 — Create the directories and install the key

```bash
mkdir -p /data/apps/cafft/{nginx,web/cafft,videos,secrets}
```

Then the key. Run these **one line at a time** — pasting a whole block makes
`read` consume the following line as its input instead of waiting for you:

```bash
read -rsp 'Gemini key: ' KEY && echo "read ${#KEY} characters"
```

```bash
printf 'proxy_set_header X-Goog-Api-Key "%s";\n' "$KEY" > /data/apps/cafft/secrets/gemini-key.conf && unset KEY && chmod 600 /data/apps/cafft/secrets/gemini-key.conf
```

Neither the key nor the command ends up in the shell history. Verify it works
before going further — this also proves the server has outbound internet access,
which the proxy needs:

```bash
KEY=$(sed -E 's/^[^"]*"([^"]*)".*$/\1/' /data/apps/cafft/secrets/gemini-key.conf)
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' -m 20 \
  -H "x-goog-api-key: $KEY" \
  'https://generativelanguage.googleapis.com/v1beta/models'
unset KEY
```

`200` is what you want. `400` means the key is malformed (usually a truncated
paste), `403` means the Generative Language API is not enabled for it, and a
timeout means the server cannot reach Google at all.

> **The file must exist before the container starts.** If it does not, Docker
> creates a *directory* with that name when mounting it and nginx fails with a
> cryptic `include` error.

## Step 2 — Upload the configuration

From the repository root on your machine:

```bash
scp docs/deploy/docker/docker-compose.yml marco@pausat.uib.es:/data/apps/cafft/
scp docs/deploy/docker/cafft.conf         marco@pausat.uib.es:/data/apps/cafft/nginx/
```

On Windows, check the files did not arrive with CRLF line endings — nginx
rejects those with "unknown directive":

```bash
grep -c $'\r' /data/apps/cafft/nginx/cafft.conf     # must print 0
# if not: sed -i 's/\r$//' /data/apps/cafft/nginx/cafft.conf
```

Validate the config with a throwaway container before touching anything real.
This checks the syntax, that the key `include` resolves, and that the image ships
the CA bundle that `proxy_ssl_verify on` needs:

```bash
docker run --rm \
  -v /data/apps/cafft/nginx/cafft.conf:/etc/nginx/conf.d/default.conf:ro \
  -v /data/apps/cafft/web:/var/www/cafft-site:ro \
  -v /data/apps/cafft/videos:/srv/cafft/videos:ro \
  -v /data/apps/cafft/secrets/gemini-key.conf:/etc/nginx/private/cafft-gemini-key.conf:ro \
  nginx:1.27-alpine nginx -t
```

The `10-listen-on-ipv6-by-default.sh: info: can not modify ...` line is harmless:
the entrypoint script wants to add an IPv6 listener to a read-only file. Traefik
connects over IPv4 on the `edge` network.

## Step 3 — Deploy the app

```bash
export CAFFT_SSH_TARGET=marco@pausat.uib.es

bash docs/deploy/deploy.sh --dry-run   # build and check, upload nothing
bash docs/deploy/deploy.sh             # build and deploy
```

The script builds, **fails the deploy if the bundle still references any
CSP-blocked host**, uploads to a staging directory, then swaps it into place so
a failed upload cannot leave the site half-updated.

Confirm the dry run prints `/data/apps/cafft/web/cafft`. If it prints
`/var/www/cafft-site/cafft`, you are running an old copy of the script.

> The `curl` check at the end of `deploy.sh` is misleading until step 4: with no
> container running, that request is still answered by PAUSAT's catch-all, which
> returns `200`. **A 200 here does not mean CAFFT is deployed.**

## Step 4 — Start the container

```bash
cd /data/apps/cafft && docker compose up -d && docker compose logs --tail=20
```

This is the moment Traefik learns CAFFT exists — it watches the Docker socket, so
no Traefik restart or config change is needed.

## Step 5 — Upload the videos

Put the files listed in `public/videos_cafft/PLACE_VIDEOS_HERE.txt` into that
directory, then:

```bash
scp public/videos_cafft/*.mp4 public/videos_cafft/*.jpg \
    marco@pausat.uib.es:/data/apps/cafft/videos/
```

(`deploy.sh --videos` does the same with `rsync`, which skips unchanged files —
but Git Bash on Windows does not ship `rsync`.)

Videos live outside the app directory and are never removed by a deploy, and the
directory is mounted live, so **adding videos needs no redeploy and no restart**.

Until they are present the app works, but the exposure sessions show the
video-load error panel, which offers the therapist a "simulate viewing" escape
hatch. The intro-page presentation video has no such fallback: without
`cafft_presentation.mp4` its modal opens black.

---

## Verification

### From the server

```bash
B=https://pausat.uib.es

curl -sS -o /dev/null -w '/cafft/ -> %{http_code}\n' $B/cafft/
curl -sS -o /dev/null -w '/       -> %{http_code}   (PAUSAT must still work)\n' $B/
curl -sSI $B/cafft | grep -iE '^HTTP/|^location'        # 301 -> /cafft/

# The decisive check: are these OUR hashed assets, or PAUSAT's catch-all?
curl -sS $B/cafft/ | grep -oE '(src|href)="/cafft/assets/[^"]+"'

curl -sSI $B/cafft/ | grep -iE 'cache-control|content-security-policy'
curl -sS -o /dev/null -w 'genai -> %{http_code}\n' $B/cafft/genai/v1beta/models
curl -sS -o /dev/null -w 'range -> %{http_code}  (206)\n' \
     -H 'Range: bytes=0-1023' $B/cafft/videos_cafft/ev001_es.mp4
curl -sS -o /dev/null -w 'listing -> %{http_code}  (403)\n' $B/cafft/videos_cafft/
```

Two of these matter more than the rest:

- **The hashed-asset grep.** `/cafft` returned `200` even before anything was
  deployed, because PAUSAT's SPA `try_files` catch-all answered it with an
  identical ETag to `/`. Only seeing `index-<hash>.js` proves it is your build.
- **`/` still returning 200.** This is the one part of the deployment that could
  affect a service you do not own.

### In the browser

Run this with devtools open. **Any CSP violation means something is broken — the
app will look fine but a feature will be silently dead.**

- [ ] The page renders with correct UIB fonts and colours (a bare, unstyled page means the Tailwind CSS did not load)
- [ ] Console shows **zero** `Content-Security-Policy` violations
- [ ] Console shows `AI Assistant: Initialized successfully (server-side proxy)`
- [ ] Network tab shows no requests to `cdn.tailwindcss.com`, `fonts.googleapis.com`, `youtube.com` or `github.com`
- [ ] Navigating the app changes the URL after `#` and back/forward work
- [ ] Registering a patient, taking the QPV-II and reaching the exposure screen all work
- [ ] An exposure video plays, and cannot be paused or seeked
- [ ] The AI chat replies — this is the only thing that exercises the proxy the way the SDK really uses it
- [ ] PAUSAT itself still works at `https://pausat.uib.es/`

`[DOM] Input elements should have autocomplete attributes` is a Chrome
suggestion, not an error.

### If the AI chat does not reply

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  'https://pausat.uib.es/cafft/genai/v1beta/models'
```

- `200` — proxy and key are fine; the problem is in the app.
- `403` — the key is wrong, or the Gemini API is not enabled for it.
- `404` — the `location /cafft/genai/` block is missing, or the trailing slashes on `proxy_pass` do not match.
- `429` — the rate limit is doing its job; raise `rate=` in the `limit_req_zone`.
- `502` — nginx cannot reach Google. Check egress, and note that `proxy_pass` resolves the hostname at container start: `docker compose restart nginx` picks up a new address.

### If the page renders unstyled

The stylesheet did not load. Check `/data/apps/cafft/web/cafft/assets/` exists and
that `docker compose logs nginx` shows no permission errors.

### If the console reports a `style-src` violation

A library is injecting a `<style>` element at runtime. Append `'unsafe-inline'`
to **`style-src` only** — never to `script-src`:

```
style-src 'self' 'unsafe-inline';
```

This is not expected: the one code path in `motion` that injects a stylesheet
(its View Transitions support) is not used by this app.

---

## Security notes

**The Gemini proxy is unauthenticated.** Moving the key server-side stops it
being stolen from the JS bundle, but the app has no server-side login — so anyone
who finds `/cafft/genai/` can spend the project's Gemini quota. `cafft.conf`
enables `limit_req` at 20 requests/minute per IP as a backstop. If the quota
matters, put the app behind the university SSO or an IP allow-list.

**All patient data lives in the browser.** `localStorage` means clinical data is
per-device and per-browser, is not backed up, is lost when a patient clears their
browser data, and is visible to anyone with access to that device or to any
script running on the origin. That is a property of the application, not of this
deployment, but it should be understood before the app is used with real
patients.

**The build ships default credentials and an unprotected dev route.**
`hooks/useAuth.tsx` seeds `testuser`/`password` and `terapeuta`/`clauacces` on
every load without checking `import.meta.env.DEV`, and `App.tsx` registers
`/dev/tools` outside any `ProtectedRoute`. Because all state is per-browser, this
is not a remote compromise — but a patient who reaches `#/dev/tools` can
irreversibly wipe their own clinical history, and there is no backup.

---

## Routine redeploys

```bash
export CAFFT_SSH_TARGET=marco@pausat.uib.es
bash docs/deploy/deploy.sh
```

Nothing else is needed. The container serves the new build immediately: the app
directory is swapped by an atomic rename **inside** the bind-mounted `web`
directory, so the mount stays valid.

Restart the container only when you change `cafft.conf`:

```bash
cd /data/apps/cafft && docker compose restart nginx
```

## Rolling back

The previous build is not kept on the server. To roll back, check out the
previous commit and redeploy:

```bash
git checkout <previous-commit>
bash docs/deploy/deploy.sh
git checkout dev
```

## Deploying somewhere other than /cafft/

The base path is a build-time constant, because Vite bakes it into asset URLs.
To deploy at a different path, build with `BASE_PATH` set, update the paths in
`docs/deploy/docker/cafft.conf`, and change the `PathPrefix` rule in
`docker-compose.yml` to match:

```bash
BASE_PATH=/therapy/ npm run build     # or BASE_PATH=/ for a root deployment
```
