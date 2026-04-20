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

## Daily Local Server Startup

```bash
cp .env.example .env
docker compose up -d
```

The compose file starts the NextPatch web container and a PostgreSQL volume. For Supabase Auth in a production-like local server, configure self-hosted Supabase services and the `NEXT_PUBLIC_SUPABASE_*` values in `.env`.

## Stop

```bash
docker compose down
supabase stop
```

## Backup

Use Settings > Data to create a JSON export. JSON export is the reversible backup format. Markdown and CSV exports are for reading and audit only.

For the database volume:

```bash
docker compose exec nextpatch-db pg_dump -U nextpatch nextpatch > nextpatch-db.dump
```

Do not commit backups to GitHub automatically. They may contain confidential repository notes.

## Restore

Use Settings > Data to validate and restore a JSON backup into a new workspace. The MVP does not merge into an existing workspace and does not restore from Markdown or CSV.

## SMTP

Supabase Auth magic links require SMTP in self-hosted or LAN use. Configure SMTP in the Supabase stack and keep credentials out of Git.

## External Exposure

External publication is not recommended for the MVP. If exposed outside a trusted LAN, use HTTPS, strong secrets, SMTP, regular JSON exports, DB volume backups, and firewall rules.
