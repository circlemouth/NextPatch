# NextPatch

NextPatch is a self-managed local server web app for organizing repository work, bugs, ideas, implementation notes, ChatGPT paste notes, and the next action to take.

The MVP is a local single-user build with password-protected login for trusted LAN use. It is not intended for public internet exposure, and you should still keep the deployment behind your own network controls. GitHub integration is limited to URL parsing, and ChatGPT integration is limited to manual paste plus local JSON/Markdown parsing.

## Requirements

- Node.js 22
- pnpm 10
- Docker Desktop or Docker Engine

## Development Startup

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`. The app uses a local single-user context during the SQLite migration.
If you need a clean local database, run `pnpm db:reset:dev` first. It removes only the SQLite file plus `-wal` and `-shm` sidecars and respects `NEXTPATCH_DB_PATH` when set.
If you want to test LAN access during development, use `pnpm dev:lan` and browse to `http://<host-lan-ip>:3000/login`.

## Daily Local Server Startup

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
docker compose up -d --build
```

Set `NEXTPATCH_LOGIN_PASSWORD` to a strong password and copy the generated value into `NEXTPATCH_SESSION_SECRET`. The compose file starts the NextPatch web container, runs database init on container start, and mounts the SQLite data volume at `/app/data`.
It binds to `0.0.0.0` by default so trusted devices on the LAN can reach the login page at `http://<host-machine-LAN-IP>:3000/login`.
Use this path when you want the app running as a persistent local server.
If your OS firewall blocks inbound traffic, allow `3000/tcp` on the host so other LAN devices can connect.
If you need HTTPS, terminate it at a reverse proxy and set `NEXTPATCH_COOKIE_SECURE=true` so the session cookie is marked secure.

You can also override the bind address and host port with `NEXTPATCH_BIND_HOST` and `NEXTPATCH_HOST_PORT` before running Compose.

## Stop

```bash
docker compose down
```

Use `docker compose down` to stop the daily local server stack.

## Schema and Migrations

The SQLite migration source of truth is the hand-written SQL under `drizzle/*.sql`.
Those files define the authoritative tables, constraints, and indexes, and the migration runner is responsible for recording applied steps in `nextpatch_migrations` history.

`src/server/db/schema.ts` is used for Drizzle query typing and should stay aligned with the SQL, but it is not the canonical source for FK or CHECK constraints.

Do not use `db:generate` for SQLite migrations; the project does not keep `drizzle-kit` as a dev dependency. New schema changes should be written directly as SQL migrations and added to the migration history through the runner.

## Backup

Use Settings > Data to create a JSON export. Keep that JSON export as the canonical backup artifact.
Markdown and CSV exports are for reading and audit only.

For the database volume, keep `data/`, `exports/`, and `backups/` out of Git. SQLite WAL and SHM sidecar files must stay with the database file while the app is running.

When DB file backup is implemented, prefer SQLite-safe backup approaches such as JSON export or a controlled SQLite backup operation rather than copying a live database file.

Do not commit backups to GitHub automatically. They may contain confidential repository notes.

## Restore

Restore is not implemented in the MVP. Treat JSON backup as the preserved backup source for future manual migration or later restore work.
The MVP does not merge into an existing workspace and does not restore from Markdown or CSV.

## Docker Build Note

The SQLite implementation is expected to use `better-sqlite3`, which has a native addon.
If the dependency is added while using the Alpine Docker image, the deps stage must include the native build toolchain needed by `node-gyp` such as Python, make, and a C++ compiler, or the image should move to a Debian-based Node image.

## Fresh Start

For a clean local restart, stop the app, remove the SQLite database with `pnpm db:reset:dev`, then rerun migrations and seed. In Docker, `docker compose down -v` also removes the data volume if you want to discard persistent state completely.

## Login Route

`/login` is the password gate for the LAN runtime. Set `NEXTPATCH_LOGIN_PASSWORD` and `NEXTPATCH_SESSION_SECRET` before starting the compose stack, then sign in from `http://<host-lan-ip>:3000/login`.

## External Exposure

External publication is not recommended for the MVP.
The app is intended for trusted LAN use behind password login and your own network controls.
Do not expose it directly to the public internet; if you need remote access, place it behind a reverse proxy, add HTTPS, and keep the session cookie secure.
