# NextPatch LAN Auth Implementation Plan

## Goal

NextPatch のローカル単一ユーザー構造を維持したまま、信頼できる LAN 内で使うための簡易パスワードログインと署名付き HttpOnly Cookie セッションを追加する。Docker Compose は LAN 内の別端末から `http://<host-lan-ip>:3000` で到達できるポート公開設定へ変更する。

## Constraints

- `LOCAL_USER_ID = "local-user"` と `PERSONAL_WORKSPACE_ID = "personal-workspace"` を維持する。
- DB にユーザー管理テーブルを追加しない。
- 認証情報は `NEXTPATCH_LOGIN_PASSWORD` と `NEXTPATCH_SESSION_SECRET` で設定する。
- 未設定時は保護対象を利用可能にしない。
- セッションは `nextpatch_session` Cookie に HMAC-SHA256 署名付きトークンとして保存する。
- Proxy では DB にアクセスしない。
- Next.js 16 のため `src/proxy.ts` を使い、`middleware.ts` は作成しない。
- インターネット公開、SSO、多人数管理、パスワードリセット、HTTPS 終端は今回の対象外。

## Protected Surface

- Pages: `/`, `/dashboard`, `/repositories`, `/work-items`, `/inbox`, `/capture`, `/ideas`, `/tech-notes`, `/references`, `/settings`
- API: `/api/export/*`
- Public: `/login`, `/_next/*`, static assets, favicon, robots

## Phases

1. Phase 0: main agent preparation
   - Inspect required files and dirty worktree state.
   - Create `docs/auth-lan-access/` artifacts.
   - Create individual git worktrees for sub-agents.
2. Phase 1: Auth Core sub-agent
   - Implement config, token signing, proxy protection, login/logout actions, and `requireLocalContext()` checks.
3. Phase 2: Auth UI sub-agent
   - Implement DADS-aligned login form and header logout affordance.
4. Phase 3: LAN Runtime & Docs sub-agent
   - Update Docker Compose, environment examples, package scripts, Docker runtime settings, and README.
5. Phase 4: Tests sub-agent
   - Add unit tests and update Playwright smoke flow for login.
6. Phase 5: main agent integration
   - Merge Phase 1 through Phase 4 in order.
   - Resolve conflicts and align action/helper names.
   - Run verification commands.
   - Generate `docs/auth-lan-access/auth-lan-access.patch`.
   - Create and inspect `nextpatch-auth-lan-access-implementation.zip`.

## Merge Order

1. `feature/auth-core`
2. `feature/auth-ui`
3. `feature/lan-runtime-docs`
4. `feature/auth-tests`

## Verification Target

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `docker compose config`
- If possible: `docker compose up -d --build`
- If possible: `http://127.0.0.1:3000/login` and LAN IP `/login` reachability checks
