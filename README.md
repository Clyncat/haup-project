# haup

Monorepo for **haup**: a React (Vite) client, an Elysia (Node.js) API, and the infrastructure that runs them. The infrastructure is Traefik as the gateway, Garage for S3 object storage and PostgreSQL, published through a Cloudflare Tunnel.

- **App:** https://app.liu-shu.com
- **Object storage (S3):** https://s3.liu-shu.com

---

## Architecture

```mermaid
flowchart LR
    U[Browser] -->|HTTPS| CF[Cloudflare]
    CF -->|Tunnel| CD[cloudflared<br/>systemd on host]
    CD -->|127.0.0.1:8081| T[Traefik]

    T -->|app.liu-shu.com /api/*| S[service<br/>Elysia :3000]
    T -->|app.liu-shu.com /*| C[client<br/>nginx :4173]
    T -->|s3.liu-shu.com| G[Garage S3 :3900]

    S --> P[(PostgreSQL :5432)]
    S --> G
```

```
Internet → Cloudflare (TLS) → cloudflared (host) → Traefik 127.0.0.1:8081
  ├─ app.liu-shu.com /api/*  → 127.0.0.1:3000  service  (Elysia, Docker)
  ├─ app.liu-shu.com /*      → 127.0.0.1:4173  client   (nginx serving client/dist, Docker)
  └─ s3.liu-shu.com          → 127.0.0.1:3900  garage   (S3 API, Docker)

service → 127.0.0.1:5432 postgres
service → 127.0.0.1:3900 garage
```

**Security model:** every port binds to `127.0.0.1` only. Nothing can be reached from the LAN or the internet directly. The only public entry point is the Cloudflare Tunnel, and TLS terminates at Cloudflare.

### Components

| Component   | Runs as                               | Port (loopback)              | Purpose                                   |
| ----------- | ------------------------------------- | ---------------------------- | ----------------------------------------- |
| cloudflared | systemd service                       | —                            | Cloudflare Tunnel → Traefik               |
| traefik     | Docker (host network)                 | 8081 (web), 8080 (dashboard) | Gateway: routes requests by host and path |
| client      | Docker (`nginx:1.29-alpine`)          | 4173                         | Serves the Vite build from `client/dist`  |
| service     | Docker (`node:26-slim`, host network) | 3000                         | Elysia API under `/api`                   |
| postgres    | Docker (`postgres:18-alpine`)         | 5432                         | Primary database                          |
| garage      | Docker (`dxflrs/garage:v2.2.0`)       | 3900 (S3), 3903 (admin)      | S3-compatible object storage              |

> **Why Traefik listens on 8081 and not 80:** this host runs k3s. k3s DNATs ports 80/443 to its own bundled Traefik with iptables (ServiceLB), and that catches traffic even when it is sent to `127.0.0.1`.

---

## Repository layout

```
.
├── docker-compose.yml       # all containers
├── .env.example             # infra secrets template → .env (never committed)
├── bin/
│   ├── gen-env.sh           # generate .env with random secrets (first run only)
│   ├── garage-init.sh       # Garage layout, bucket, access key (idempotent)
│   ├── smoke-test.sh        # end-to-end checks (add --public to go through Cloudflare)
│   └── tunnel.sh            # cloudflared: status | start | stop | restart | logs | install
├── traefik/dynamic.yml      # routes (hot-reloaded)
├── garage/garage.toml       # Garage config (secrets come from env)
├── nginx/client.conf        # SPA config for the client
├── cloudflared/config.yml   # tunnel ingress (copy of ~/.cloudflared/config.yml)
├── client/                  # React + Vite
├── service/                 # Elysia API
└── data/                    # persistent volumes: postgres, garage (never committed)
```

---

## Prerequisites

- Docker Engine 29+ with the Compose plugin
- Node.js 26 (match the `node:26-slim` image used by `service`)
- `cloudflared`, logged in, with the tunnel already created (server only)
- `openssl` (used by `gen-env.sh`)

---

## First-time setup (server)

```bash
# 1. Secrets
./bin/gen-env.sh                 # writes .env and prints the values for service/.env

# 2. Build the apps once (client/dist must exist before the first `up`)
(cd client  && npm ci && npm run build)
(cd service && npm ci && npm run build)

# 3. Service env (see "Environment variables" below)
#    create service/.env from the values printed by gen-env.sh

# 4. Start everything
docker compose up -d
./bin/garage-init.sh             # create bucket + key

# 5. Cloudflare Tunnel
cloudflared tunnel route dns <TUNNEL_ID> app.liu-shu.com
cloudflared tunnel route dns <TUNNEL_ID> s3.liu-shu.com
cp cloudflared/config.yml ~/.cloudflared/config.yml
./bin/tunnel.sh install          # installs and starts the systemd service

# 6. Verify
./bin/smoke-test.sh --public
```

---

## Running locally (development)

To develop with hot reload, run the infra in Docker and the apps directly on your machine.

```bash
# Start infra only (no client/service containers)
docker compose up -d postgres garage
./bin/garage-init.sh             # first time only
```

**Service**, hot reload on http://127.0.0.1:3000/api:

```bash
cd service
npm run dev                      # node --env-file-if-exists=.env --watch src/index.ts
```

**Client**, hot reload on http://localhost:5173:

```bash
cd client
npm run dev
```

Add a dev proxy so the client can call `/api` the same way it does in production:

```ts
// client/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": "http://127.0.0.1:3000" },
  },
});
```

To work from a laptop against the server, forward the ports over SSH:

```bash
ssh -L 5173:localhost:5173 -L 5432:localhost:5432 -L 8080:localhost:8080 wipay-server
# 5173 = Vite dev, 5432 = Postgres (for DB tools), 8080 = Traefik dashboard
```

---

## Deploy

| App     | Command                                                          | Notes                                                           |
| ------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| client  | `cd client && npm run build`                                     | Live immediately, because nginx serves the bind-mounted `dist/` |
| service | `cd service && npm run build && docker compose restart service`  | Node loads code at startup, so the container must restart       |
| routes  | edit `traefik/dynamic.yml`                                       | Traefik hot-reloads the file; no restart needed                 |
| tunnel  | edit `~/.cloudflared/config.yml`, then `./bin/tunnel.sh restart` | The script syncs the file to `/etc/cloudflared/`                |

---

## Environment variables

### `.env` (root, infra)

Generated by `./bin/gen-env.sh`. Holds the Postgres credentials, Garage RPC/admin/metrics tokens and the S3 key. **Never give this file to the app**, because the Garage admin token controls the whole cluster.

### `service/.env` (app)

Contains only what the service needs:

```bash
set -a; source .env; set +a
cat > service/.env <<EOF
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}
S3_ENDPOINT=http://127.0.0.1:3900
S3_PUBLIC_ENDPOINT=https://s3.liu-shu.com
S3_REGION=garage
S3_FORCE_PATH_STYLE=true
S3_BUCKET=${S3_BUCKET}
S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
EOF
chmod 600 service/.env
```

| Variable                            | Used for                                            |
| ----------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`                      | PostgreSQL connection                               |
| `S3_ENDPOINT`                       | Server-side S3 calls (upload, delete) over loopback |
| `S3_PUBLIC_ENDPOINT`                | Signing URLs that the browser opens                 |
| `S3_REGION` / `S3_FORCE_PATH_STYLE` | Garage requires region `garage` and path-style URLs |

`NODE_ENV` is **not** set in `.env`. It is set per run mode: `production` in Compose and in `npm start`, and left unset in `npm run dev`.

---

## API conventions

- Every route lives under `/api`: `new Elysia({ prefix: '/api' })`
- Listen on `127.0.0.1:3000`
- `GET /api/health` must return 200, because the container healthcheck calls it

### Image upload flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant S as service (/api)
    participant G as Garage
    participant D as Postgres

    B->>S: POST /api/images (multipart/form-data)
    S->>S: validate type & size
    S->>G: PutObject images/<uuid>.jpg
    S->>D: store key
    S-->>B: { key, url (presigned, 1h) }
    B->>G: GET url via s3.liu-shu.com
```

- Store the object **key** in Postgres, never the presigned URL, because the URL expires.
- For large files (over about 10MB, or anything close to Cloudflare's 100MB request limit), switch to presigned PUT so the browser uploads straight to `s3.liu-shu.com`. That requires CORS on the bucket.

---

## Scripts

| Script                         | Description                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `bin/gen-env.sh`               | Creates `.env` from `.env.example` with random secrets. Refuses to overwrite an existing file.                                                  |
| `bin/garage-init.sh`           | Assigns the Garage layout, imports the access key from `.env`, creates the bucket and grants RWO. Safe to re-run.                               |
| `bin/smoke-test.sh [--public]` | Checks container health, Postgres read/write, S3 upload/download, Traefik routing and, with `--public`, presigned downloads through Cloudflare. |
| `bin/tunnel.sh [cmd]`          | `status` (default), `start`, `stop`, `restart`, `logs`, `install`. Also detects a cloudflared started by hand.                                  |

---

## Operations

```bash
docker compose ps                        # status + health
docker compose logs -f service           # follow logs
./bin/tunnel.sh                          # tunnel status
./bin/smoke-test.sh --public             # full check

# Traefik dashboard (from your laptop)
ssh -L 8080:localhost:8080 wipay-server  # → http://localhost:8080

# Postgres shell
docker compose exec postgres psql -U haup -d haup

# Garage CLI
docker compose exec garage /garage status
docker compose exec garage /garage bucket info haup
```

### Backup

Back up these two together:

- `data/`: Postgres and Garage (Garage `meta/` and `data/` must stay consistent with each other)
- `.env`: without it, the existing data cannot be used

For a consistent Postgres dump while it is running:

```bash
docker compose exec -T postgres pg_dump -U haup -Fc haup > backup-$(date +%F).dump
```

---

## Troubleshooting

| Symptom                                                   | Cause / fix                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `404 page not found` from Traefik on port 80              | k3s intercepts port 80. Use **8081** (already configured).                                        |
| cloudflared: `connection refused 127.0.0.1:8081`          | Traefik is not running or not on 8081. Run `docker compose up -d traefik`.                        |
| `502` on `/api`                                           | The service is not running. Check `docker compose ps service` and `docker compose logs service`.  |
| `NOT_FOUND` on `/api/...`                                 | The request reached Elysia, but no route matches. Check the `prefix: '/api'` and rebuild.         |
| `service` is `unhealthy`                                  | `/api/health` is missing or the code was not rebuilt (`npm run build`).                           |
| Vite: `Blocked request. This host is not allowed`         | Add `allowedHosts: ['app.liu-shu.com']` to `preview`/`server` in `vite.config.ts`.                |
| `bash\r: bad interpreter`                                 | CRLF line endings from Windows. Run `sed -i 's/\r$//' bin/*.sh` (`.gitattributes` prevents this). |
| `Permission denied` when running a script                 | `chmod +x bin/*.sh`                                                                               |
| `npm run build` fails on `client/dist` with EACCES        | Docker created the directory as root. Run `sudo chown -R $USER: client/dist`.                     |
| Unknown paths on the client return the app instead of 404 | Intended (SPA fallback). Handle it with a `path="*"` route in React Router.                       |
