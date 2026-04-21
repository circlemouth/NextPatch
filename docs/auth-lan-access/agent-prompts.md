# Sub-Agent Prompts

## Auth Core

あなたは NextPatch の Auth Core サブエージェントです。必ず `../nextpatch-auth-core` の個別 git worktree で作業してください。他の worktree は編集しないでください。

目的: NextPatch に単一ユーザー向けの簡易ログイン基盤を追加する。

担当範囲:

- `src/server/auth/session.ts`
- `src/server/auth/config.ts` 新規作成可
- `src/server/auth/session-token.ts` 新規作成可
- `src/server/auth/redirects.ts` 新規作成可
- `src/server/auth/actions.ts` 新規作成可
- `src/proxy.ts` 新規作成
- 必要最小限の関連ファイル

要件:

- `NEXTPATCH_LOGIN_PASSWORD` と `NEXTPATCH_SESSION_SECRET` を使う。
- 署名付き HttpOnly Cookie セッションを実装する。
- Cookie 名は `nextpatch_session` を基本にする。
- `maxAge` は `NEXTPATCH_SESSION_MAX_AGE_SECONDS`、未指定なら `604800` 秒。
- `secure` は `NEXTPATCH_COOKIE_SECURE=true` のときのみ true。
- `sameSite` は `lax`、`path` は `/`。
- セッション検証は Proxy と Server Action / Server Component の両方で使えるようにする。
- Proxy では DB にアクセスしない。
- Next.js 16 のため `src/proxy.ts` を使い、`middleware.ts` は作らない。
- Protected paths: `/`, `/dashboard`, `/repositories`, `/work-items`, `/inbox`, `/capture`, `/ideas`, `/tech-notes`, `/references`, `/settings`, `/api/export/*`
- Public paths: `/login`, `/_next/*`, favicon, robots, public static assets
- 未認証ページアクセスは `/login?next=<safe path>` へ。
- 未認証 API アクセスは 401 か login redirect のどちらかを、実装全体の整合性を見て採用する。
- 認証済みで `/login` に来たら `/dashboard` へ。
- `next` パラメータは内部パスのみ許可。
- `requireLocalContext()` はセッション検証後に既存の local user/workspace を返す。
- 未認証で Server Action によるデータ変更ができないようにする。
- 認証未設定時は認証を通さない。

検証:

- `pnpm typecheck`
- 可能なら対象 unit test を追加して `pnpm test` の該当範囲

報告:

- 変更ファイル一覧
- 実装内容
- 実行した検証
- 未実行検証と理由
- メイン側マージ時の注意点

## Auth UI

あなたは NextPatch の Auth UI サブエージェントです。必ず `../nextpatch-auth-ui` の個別 git worktree で作業してください。他の worktree は編集しないでください。

目的: DADS 参照ルールに沿った簡易ログイン画面とログアウト導線を実装する。

担当範囲:

- `src/app/(auth)/login/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/globals.css`
- `src/styles/tokens.css` は必要な場合のみ

要件:

- `/login` は実ログインフォームにする。
- ラベル必須、サポートテキストあり、プレースホルダーに依存しない。
- エラーは静的に具体的に表示し、disabled を安易に使わない。
- ボタン押下領域は 44px 以上、プライマリー CTA は「ログイン」1つ。
- 入力は `type=password`, `name=password`, `autocomplete=current-password`。
- label: `ログインパスワード ※必須`
- support text: `LAN内のNextPatchにアクセスするための共通パスワードを入力します。`
- invalid error: `＊パスワードが一致しません。管理者が設定したログインパスワードを入力してください。`
- missing-config error: `＊ログイン設定が不足しています。.env の NEXTPATCH_LOGIN_PASSWORD と NEXTPATCH_SESSION_SECRET を設定してから再起動してください。`
- ログイン画面に `NextPatch` と `LAN内利用向けの簡易ログイン` を表示する。
- パスワードやシークレットの値は表示しない。
- ヘッダーにログアウトボタンを追加する。
- 既存の Quick Capture 導線も維持する。
- 「ローカル運用」は LAN ログイン導入後に合う表現へ更新する。
- モバイル幅でも破綻しない。

検証:

- `pnpm typecheck`
- `pnpm lint`
- 可能ならスクリーンリーダー/キーボード操作観点の確認項目を報告

報告:

- 変更ファイル一覧
- 実装内容
- 実行した検証
- 未実行検証と理由
- メイン側マージ時の注意点

## LAN Runtime & Docs

あなたは NextPatch の LAN Runtime & Docs サブエージェントです。必ず `../nextpatch-lan-runtime-docs` の個別 git worktree で作業してください。他の worktree は編集しないでください。

目的: localhost 固定の公開仕様を修正し、ログイン保護付きで LAN 内の他端末からアクセスできる起動設定とドキュメントを整える。

担当範囲:

- `docker-compose.yml`
- `Dockerfile`
- `.env.example`
- `package.json`
- `README.md`
- `docs/auth-lan-access/*` のうちランタイム・運用説明に関する部分

要件:

- `docker-compose.yml` の ports を `${NEXTPATCH_BIND_HOST:-0.0.0.0}:${NEXTPATCH_HOST_PORT:-3000}:3000` に変更する。
- `PORT` はコンテナ内 3000 を維持する。
- 必要なら `HOSTNAME=0.0.0.0` を設定する。
- `.env.example` に `NEXTPATCH_BIND_HOST`, `NEXTPATCH_HOST_PORT`, `NEXTPATCH_LOGIN_PASSWORD`, `NEXTPATCH_SESSION_SECRET`, `NEXTPATCH_SESSION_MAX_AGE_SECONDS`, `NEXTPATCH_COOKIE_SECURE` を追加する。
- `.env.example` に実秘密値を入れない。
- README の古い「ログイン機能なし」「LAN 公開非推奨」「127.0.0.1 固定」などの説明を新仕様に合わせて修正する。
- 信頼できる LAN 内利用であること、インターネット公開は対象外であること、HTTPS が必要ならリバースプロキシ終端と `NEXTPATCH_COOKIE_SECURE=true` が必要であることを書く。
- 必要なら `dev:lan` を追加する。

検証:

- `docker compose config`
- 影響があれば `pnpm lint` / `pnpm typecheck`
- Docker 実起動ができるなら `docker compose up -d --build`

報告:

- 変更ファイル一覧
- 実装内容
- 実行した検証
- 未実行検証と理由
- メイン側マージ時の注意点

## Tests

あなたは NextPatch の Tests サブエージェントです。必ず `../nextpatch-auth-tests` の個別 git worktree で作業してください。他の worktree は編集しないでください。

目的: 簡易ログインと LAN 対応に合わせて unit/e2e テストを更新する。

担当範囲:

- `src/server/auth/*.test.ts` 新規作成可
- `tests/e2e/sqlite-smoke.spec.ts`
- `scripts/e2e/web-server.ts`
- `playwright.config.ts`
- 必要最小限のテスト補助ファイル

要件:

- Unit test: セッショントークン生成・検証、期限切れ拒否、署名改ざん拒否、`next` 安全化、認証設定不足検出。
- e2e: 未認証 `/dashboard` の `/login` 誘導、誤パスワードの具体的エラー、正しいパスワードでログイン、既存 smoke flow 継続、認証後 API export 200。
- `scripts/e2e/web-server.ts` でテスト用の `NEXTPATCH_LOGIN_PASSWORD` と `NEXTPATCH_SESSION_SECRET` を設定する。
- 既存 `assertNoAuthPrompts` は外部認証プロンプト確認に限定する。

検証:

- `pnpm test`
- `pnpm test:e2e`
- 必要なら `pnpm typecheck`

報告:

- 変更ファイル一覧
- 実装内容
- 実行した検証
- 未実行検証と理由
- メイン側マージ時の注意点
