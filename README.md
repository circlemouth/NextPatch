# NextPatch

NextPatch is a self-managed local server web app for organizing repository work, bugs, ideas, implementation notes, ChatGPT paste notes, and the next action to take.

The MVP is private by default. There is no unauthenticated standard mode. GitHub integration is limited to URL parsing, and ChatGPT integration is limited to manual paste plus local JSON/Markdown parsing.

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

## Daily Local Server Startup

```bash
cp .env.example .env
docker compose up -d
```

The compose file starts the NextPatch web container, runs database init on container start, and mounts the SQLite data volume at `/app/data`.
It binds only to `127.0.0.1:3000` so the service stays on the local machine by default.

## Stop

```bash
docker compose down
```

Use `docker compose down` to stop the daily local server stack.

## Backup

Use Settings > Data to create a JSON export. JSON export is the reversible backup format for restoring into a new workspace.
Markdown and CSV exports are for reading and audit only.

For the database volume, keep `data/`, `exports/`, and `backups/` out of Git. SQLite WAL and SHM sidecar files must stay with the database file while the app is running.

When DB file backup is implemented, prefer SQLite-safe backup approaches such as JSON export or a controlled SQLite backup operation rather than copying a live database file.

Do not commit backups to GitHub automatically. They may contain confidential repository notes.

## Restore

Use Settings > Data to validate and restore a JSON backup into a new workspace.
The MVP does not merge into an existing workspace and does not restore from Markdown or CSV.

## Docker Build Note

The SQLite implementation is expected to use `better-sqlite3`, which has a native addon.
If the dependency is added while using the Alpine Docker image, the deps stage must include the native build toolchain needed by `node-gyp` such as Python, make, and a C++ compiler, or the image should move to a Debian-based Node image.

## Fresh Start

For a clean local restart, stop the app, remove the SQLite database with `pnpm db:reset:dev`, then rerun migrations and seed. In Docker, `docker compose down -v` also removes the data volume if you want to discard persistent state completely.

## External Exposure

External publication is not recommended for the MVP.
If you expose it outside a trusted LAN, use HTTPS, an explicit access-control layer, regular JSON exports, DB volume backups, and firewall rules. The default compose port binding is local-only; change it explicitly if you intend to publish the service on your LAN.
