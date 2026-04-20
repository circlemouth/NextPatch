# NextPatch

NextPatch is a self-managed local server web app for organizing repository work, bugs, ideas, implementation notes, ChatGPT paste notes, and the next action to take.

The MVP is private by default. There is no unauthenticated standard mode. GitHub integration is limited to URL parsing, and ChatGPT integration is limited to manual paste plus local JSON/Markdown parsing.

## Requirements

- Node.js 22
- pnpm 10
- Docker Desktop or Docker Engine
- Supabase CLI for development mode

## Development Startup

```bash
pnpm install
cp .env.example .env.local
supabase start
pnpm dev
```

Open `http://localhost:3000`. Use the Supabase local email viewer to complete magic-link login.
For development mode, `supabase start` also starts the local Auth stack that the app expects.

## Daily Local Server Startup

```bash
cp .env.example .env
docker compose up -d
```

The compose file starts the NextPatch web container and the `nextpatch-db` PostgreSQL service.
Use this path when you want the app running as a persistent local server instead of the dev stack.
For Supabase Auth in a production-like local server, configure self-hosted Supabase services and the `NEXT_PUBLIC_SUPABASE_*` values in `.env`.

## Stop

```bash
docker compose down
supabase stop
```

Use `docker compose down` to stop the daily local server stack.
Use `supabase stop` to stop the development Supabase stack.

## Backup

Use Settings > Data to create a JSON export. JSON export is the reversible backup format for restoring into a new workspace.
Markdown and CSV exports are for reading and audit only.

For the database volume:

```bash
docker compose exec nextpatch-db pg_dump -U nextpatch nextpatch > nextpatch-db.dump
```

That dump is a local infrastructure backup for the PostgreSQL volume, not the app-level restore format.
Do not commit backups to GitHub automatically. They may contain confidential repository notes.

## Restore

Use Settings > Data to validate and restore a JSON backup into a new workspace.
The MVP does not merge into an existing workspace and does not restore from Markdown or CSV.
If you are restoring a local PostgreSQL dump, reload it into the `nextpatch-db` container separately from the app-level JSON restore flow.

## SMTP

Supabase Auth magic links require SMTP in self-hosted or LAN use.
Development mode can use the Supabase local mail viewer, but any self-hosted or shared LAN setup must configure SMTP in the Supabase stack.
Keep SMTP credentials out of Git.

## External Exposure

External publication is not recommended for the MVP.
If you expose it outside a trusted LAN, use HTTPS, strong secrets, SMTP, regular JSON exports, DB volume backups, and firewall rules.
