# Auth LAN Access Checklist

## Auth Core

- [ ] `NEXTPATCH_LOGIN_PASSWORD` and `NEXTPATCH_SESSION_SECRET` are required for protected access.
- [ ] Session cookie is HttpOnly, sameSite lax, path `/`, max age configurable, and optionally secure.
- [ ] Session token includes issued-at, expiry, and HMAC-SHA256 signature.
- [ ] Password comparison uses timing-safe comparison where practical.
- [ ] `src/proxy.ts` protects the required page and export API paths.
- [ ] `/login` remains public and authenticated users are sent to `/dashboard`.
- [ ] Unsafe `next` values fall back to `/dashboard`.
- [ ] `requireLocalContext()` blocks unauthenticated access before returning the local context.

## UI

- [ ] Login page has a visible label, support text, and one primary `ログイン` CTA.
- [ ] Password input uses `type=password`, `name=password`, and `autocomplete=current-password`.
- [ ] Invalid password and missing config errors are explicit and static.
- [ ] Password and secret values are never rendered.
- [ ] Header includes logout and preserves Quick Capture.
- [ ] Header copy reflects LAN authenticated operation.
- [ ] Mobile layout remains usable.

## LAN Runtime & Docs

- [ ] Compose port binding supports LAN access with configurable host and port.
- [ ] Container still uses port 3000 internally.
- [ ] Runtime binds to `0.0.0.0` when required by standalone Next server.
- [ ] `.env.example` contains auth and LAN variables with no real secrets.
- [ ] README explains trusted LAN-only usage, setup, secret generation, firewall note, and HTTPS reverse proxy option.
- [ ] README does not retain obsolete "no login" or localhost-only operation claims.

## Tests

- [ ] Unit tests cover token success, expiry, tampering, next sanitization, and missing config.
- [ ] e2e sets test auth environment variables.
- [ ] e2e covers unauthenticated redirect, invalid password error, successful login, existing smoke flow, export API 200.
- [ ] External auth prompt check no longer rejects the legitimate login UI.

## Final Artifacts

- [ ] `docs/auth-lan-access/auth-lan-access.patch` created with `git diff --binary`.
- [ ] `nextpatch-auth-lan-access-implementation.zip` created at repo root.
- [ ] Zip excludes generated, database, and bulky runtime artifacts.
- [ ] `unzip -l` output inspected.
- [ ] Final verification results recorded.
