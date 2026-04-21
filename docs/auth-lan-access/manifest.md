# Auth LAN Access Manifest

## Required Deliverables

- Source changes for auth core, login/logout UI, LAN runtime configuration, docs, and tests.
- `docs/auth-lan-access/implementation-plan.md`
- `docs/auth-lan-access/agent-prompts.md`
- `docs/auth-lan-access/checklist.md`
- `docs/auth-lan-access/manifest.md`
- `docs/auth-lan-access/auth-lan-access.patch`
- `nextpatch-auth-lan-access-implementation.zip`

## Expected Changed Areas

- `src/server/auth/*`
- `src/proxy.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/globals.css`
- `tests/e2e/sqlite-smoke.spec.ts`
- `scripts/e2e/web-server.ts`
- `playwright.config.ts` if required
- `README.md`
- `.env.example`
- `docker-compose.yml`
- `Dockerfile`
- `package.json`

## Zip Exclusions

- `node_modules/`
- `.next/`
- `data/`
- `exports/`
- `backups/`
- SQLite database files, WAL, and SHM files
- `playwright-report/`
- `test-results/`

## Notes

- The final README must describe LAN usage as trusted LAN-only operation.
- Public internet exposure is outside this implementation and requires separate HTTPS, reverse proxy, and firewall controls.
