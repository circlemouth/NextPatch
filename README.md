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
pnpm dev
```

Open `http://localhost:3000`. The app uses a local single-user context during the SQLite migration.

## Daily Local Server Startup

```bash
cp .env.example .env
docker compose up -d
```

The compose file starts the NextPatch web container and mounts the SQLite data volume at `/app/data`.
By default, the local server is meant to be opened from `http://localhost:3000` on the host machine.
Use this path when you want the app running as a persistent local server.

## Stop

```bash
docker compose down
```

Use `docker compose down` to stop the daily local server stack.

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
If the dependency is added while using the Alpine Docker image, the deps/builder stages must include the native build toolchain needed by `node-gyp` such as Python, make, and a C++ compiler, or the image should move to a Debian-based Node image.

## External Exposure

External publication is not recommended for the MVP.
The app is a local single-user build with access control not implemented, so exposing it on a LAN is unsafe unless you add your own protection layer.
If you expose it outside a trusted LAN, use HTTPS, an explicit access-control layer, regular JSON exports, DB volume backups, and firewall rules.
