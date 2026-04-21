# Auth LAN Access Checklist

## Auth Core

- [x] `NEXTPATCH_LOGIN_PASSWORD` and `NEXTPATCH_SESSION_SECRET` are required for protected access.
- [x] Session cookie is HttpOnly, sameSite lax, path `/`, max age configurable, and optionally secure.
- [x] Session token includes issued-at, expiry, and HMAC-SHA256 signature.
- [x] Password comparison uses timing-safe comparison where practical.
- [x] `src/proxy.ts` protects the required page and export API paths.
- [x] `/login` remains public and authenticated users are sent to `/dashboard`.
- [x] Unsafe `next` values fall back to `/dashboard`.
- [x] `requireLocalContext()` blocks unauthenticated access before returning the local context.

## UI

- [x] Login page has a visible label, support text, and one primary `ログイン` CTA.
- [x] Password input uses `type=password`, `name=password`, and `autocomplete=current-password`.
- [x] Invalid password and missing config errors are explicit and static.
- [x] Password and secret values are never rendered.
- [x] Header includes logout and preserves Quick Capture.
- [x] Header copy reflects LAN authenticated operation.
- [x] Mobile layout remains usable.

## LAN Runtime & Docs

- [x] Compose port binding supports LAN access with configurable host and port.
- [x] Container still uses port 3000 internally.
- [x] Runtime binds to `0.0.0.0` when required by standalone Next server.
- [x] `.env.example` contains auth and LAN variables with no real secrets.
- [x] README explains trusted LAN-only usage, setup, secret generation, firewall note, and HTTPS reverse proxy option.
- [x] README does not retain obsolete "no login" or localhost-only operation claims.

## Tests

- [x] Unit tests cover token success, expiry, tampering, next sanitization, and missing config.
- [x] e2e sets test auth environment variables.
- [x] e2e covers unauthenticated redirect, invalid password error, successful login, existing smoke flow, export API 200.
- [x] External auth prompt check no longer rejects the legitimate login UI.

## Final Artifacts

- [ ] `docs/auth-lan-access/auth-lan-access.patch` created with `git diff --binary`.
- [ ] `nextpatch-auth-lan-access-implementation.zip` created at repo root.
- [ ] Zip excludes generated, database, and bulky runtime artifacts.
- [ ] `unzip -l` output inspected.
- [x] Final verification results recorded.
