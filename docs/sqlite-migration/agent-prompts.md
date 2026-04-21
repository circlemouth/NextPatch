# NextPatch SQLite 移行 サブエージェント用プロンプト集

このファイルは、後続の Codex 実装エージェントへそのまま渡せるプロンプト集です。

共通方針:

- 必ず個別の git worktree で作業する。
- 変更前に対象ファイルを確認する。
- Supabase を復活させない。
- Supabase Cloud / self-hosted / CLI local は採用しない。
- PostgreSQL コンテナを戻さない。
- 後方互換性は不要。
- 既存データは 1 件もない。
- 作業範囲外の変更をしない。
- 変更後に検証コマンドを実行する。
- 完了報告に変更点、検証結果、未解決リスクを含める。

---

## 1. DB設計・migration エージェント

```text
あなたは NextPatch SQLite 移行の「DB設計・migration エージェント」です。

必ず個別の git worktree で作業してください。
例:
git worktree add ../nextpatch-db-sqlite -b feature/sqlite-db-foundation

目的:
Supabase / PostgreSQL 前提を使わず、NextPatch のローカル継続運用向け SQLite DB 基盤を実装する。

前提:
- 後方互換性は不要。
- 既存データは 1 件もない。
- Supabase を復活させない。
- PostgreSQL コンテナや Supabase local は使わない。
- DB は SQLite。
- 推奨構成は better-sqlite3 + Drizzle ORM + Drizzle Kit。
- 画面や server action が DB client を直接触らないよう、query layer へ寄せる土台を作る。

変更前に必ず確認するファイル:
- package.json
- pnpm-lock.yaml
- supabase/migrations/202604200001_initial_schema.sql
- src/server/types.ts
- src/server/auth/session.ts
- src/server/domain/dashboard.ts
- src/server/domain/export.ts
- .env.example
- docker-compose.yml

作業範囲:
1. package.json から Supabase dependencies を削除し、SQLite/Drizzle 関連 dependencies を追加する。
   - drizzle-orm
   - better-sqlite3
   - drizzle-kit
   - @types/better-sqlite3
2. drizzle.config.ts を追加する。
3. src/server/db/ を作成する。
   - client.ts
   - paths.ts
   - schema.ts
   - migrate.ts
   - seed.ts
   - queries/context.ts
4. SQLite schema を作る。
   - uuid は text。
   - timestamp は ISO8601 text。
   - boolean は SQLite integer boolean。
   - enum は text + CHECK または validation。
   - auth.users FK は使わない。
   - RLS / policy は作らない。
   - workspace_id は残す。
   - user_id は local-user 用に残す。
   - local_users table を最小構成で追加する。
5. seed で以下を作る。
   - local_users: id = "local-user"
   - workspaces: id = "personal-workspace"
   - workspace_members: local-user owner
6. DB 接続時に以下を適用する。
   - PRAGMA foreign_keys = ON
   - PRAGMA journal_mode = WAL
   - PRAGMA busy_timeout = 5000
7. package scripts 候補を追加する。
   - db:migrate
   - db:seed
   - db:reset:dev
8. テストで使いやすいよう、NEXTPATCH_DB_PATH で DB path を差し替えられるようにする。

作業しないこと:
- page.tsx の大規模移行はしない。
- server actions の全置換はしない。
- export UI の大幅変更はしない。
- Supabase client 互換 wrapper を作らない。
- Supabase 関連 package を残さない。

変更後に実行すべき検証コマンド:
- pnpm install
- pnpm typecheck
- pnpm db:migrate
- pnpm db:seed
- pnpm test
- grep -R "createServerSupabaseClient\|@supabase\|auth.users\|row level security" src package.json drizzle.config.ts drizzle || true

完了報告に含める内容:
- 追加した package
- 作成した DB 関連ファイル
- 作成した table 一覧
- seed 内容
- 実行した検証コマンドと結果
- 未解決リスク
```

---

## 2. Supabase削除・環境整理エージェント

```text
あなたは NextPatch SQLite 移行の「Supabase削除・環境整理エージェント」です。

必ず個別の git worktree で作業してください。
例:
git worktree add ../nextpatch-remove-supabase -b feature/remove-supabase-env

目的:
Supabase / Supabase Auth / Supabase migration / PostgreSQL Docker 依存を完全に削除し、SQLite ローカル運用向けの環境ファイルへ整理する。

前提:
- 後方互換性は不要。
- 既存データはない。
- Supabase を復活させない。
- Supabase Cloud / self-hosted / CLI local は採用しない。
- PostgreSQL コンテナは不要。
- DB は SQLite。

変更前に必ず確認するファイル:
- package.json
- pnpm-lock.yaml
- .env.example
- .gitignore
- .dockerignore
- docker-compose.yml
- Dockerfile
- src/server/supabase/server.ts
- src/server/actions/auth.ts
- src/app/auth/callback/route.ts
- src/app/(auth)/login/page.tsx
- src/app/(app)/settings/system/page.tsx
- supabase/config.toml
- supabase/migrations/202604200001_initial_schema.sql

作業範囲:
1. src/server/supabase/ を削除する。
2. supabase/ ディレクトリを削除する。
3. src/app/auth/callback/route.ts を削除する。
4. Supabase magic link 前提の login UI / auth actions を削除または local redirect に置換する。
5. .env.example から以下を削除する。
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - SMTP_* for Supabase Auth
6. .env.example を SQLite local runtime 用にする。
   - NEXT_PUBLIC_APP_URL=http://localhost:3000
   - NEXTPATCH_RUNTIME_MODE=local-server
   - NEXTPATCH_DATA_DIR=./data
   - NEXTPATCH_DB_PATH=./data/nextpatch.sqlite
   - NEXTPATCH_EXPORT_DIR=./data/exports
7. .gitignore に以下を追加する。
   - data/
   - exports/
   - *.sqlite
   - *.sqlite-wal
   - *.sqlite-shm
   - *.db
   - *.db-wal
   - *.db-shm
   - backups/
8. docker-compose.yml から nextpatch-db PostgreSQL service と volume を削除する。
9. nextpatch-web に SQLite data volume を追加する。
10. Dockerfile について better-sqlite3 native dependency の build に必要な注意点を docs に残す。
11. package.json から Supabase dependencies が消えていることを確認する。

作業しないこと:
- DB schema の詳細設計はしない。
- query layer の大規模実装はしない。
- Supabase 互換 API を作らない。
- PostgreSQL service を残さない。

変更後に実行すべき検証コマンド:
- pnpm install
- pnpm typecheck
- grep -R "supabase\|Supabase\|SUPABASE\|magic link\|signInWithOtp\|auth/callback" . --exclude-dir=node_modules --exclude-dir=.git || true
- docker compose config
- docker compose build

完了報告に含める内容:
- 削除したファイル / ディレクトリ
- 更新した env / Docker / ignore 設定
- grep 結果
- Docker build 結果
- 残存 Supabase 文字列がある場合の理由
```

---

## 3. server actions / domain query 移行エージェント

```text
あなたは NextPatch SQLite 移行の「server actions / domain query 移行エージェント」です。

必ず個別の git worktree で作業してください。
例:
git worktree add ../nextpatch-actions-sqlite -b feature/sqlite-actions-domain

目的:
server actions と domain query から Supabase fluent query を排除し、SQLite/Drizzle の query function / repository function へ移行する。

前提:
- 後方互換性は不要。
- Supabase を復活させない。
- 画面や actions で DB client を直接触る構造を増やさない。
- workspace_id scope を必ず守る。
- 複数ユーザー機能は今回対象外。
- local-user / personal-workspace を使う。

変更前に必ず確認するファイル:
- src/server/auth/session.ts
- src/server/actions/repositories.ts
- src/server/actions/work-items.ts
- src/server/actions/capture.ts
- src/server/actions/classification.ts
- src/server/domain/dashboard.ts
- src/server/domain/status.ts
- src/server/domain/work-item-defaults.ts
- src/server/domain/import-parser.ts
- src/server/validation/schemas.ts
- src/server/types.ts
- src/server/db/schema.ts
- src/server/db/client.ts

作業範囲:
1. requireSession() 依存を requireLocalContext() へ置換する。
2. actions から supabase 変数を削除する。
3. 以下を SQLite command function に置換する。
   - createRepository
   - archiveRepository
   - createWorkItem
   - updateWorkItemStatus
   - quickCapture
   - classifyMemo
4. transaction が必要な処理は transaction にする。
   - updateWorkItemStatus: item 更新 + status_histories insert
   - quickCapture: memo insert + classification_candidates insert
   - classifyMemo: new item insert + memo update
5. dashboard は SQLite query + mapper に置換する。
   - work_items と repositories を join する。
   - workspace_id = personal-workspace を必ず条件に含める。
6. src/server/db/queries/ に必要な query/command function を追加する。
   - repositories.ts
   - work-items.ts
   - dashboard.ts
   - classification.ts
7. page.tsx の大規模変更はしないが、必要な query function export は用意する。
8. validation は既存 zod schema を活かす。
9. crypto.randomUUID() で id を生成する。
10. created_at / updated_at は new Date().toISOString() を使う。

作業しないこと:
- UI 文言全体の整理はしない。
- Docker / env の大規模変更はしない。
- export / backup の全移行はしない。
- Supabase client 互換 wrapper を作らない。
- workspace_id 条件なしの query を作らない。

変更後に実行すべき検証コマンド:
- pnpm typecheck
- pnpm test
- pnpm lint
- grep -R "supabase\|createServerSupabaseClient\|from(" src/server || true
- NEXTPATCH_DB_PATH=./data/test-actions.sqlite pnpm db:migrate
- NEXTPATCH_DB_PATH=./data/test-actions.sqlite pnpm db:seed

完了報告に含める内容:
- 置換した actions
- 追加した query functions
- transaction 化した処理
- workspace_id scope の実装方針
- 実行した検証コマンドと結果
- 未移行の Supabase 依存があれば一覧
```

---

## 4. page.tsx / UI文言移行エージェント

```text
あなたは NextPatch SQLite 移行の「page.tsx / UI文言移行エージェント」です。

必ず個別の git worktree で作業してください。
例:
git worktree add ../nextpatch-ui-local -b feature/sqlite-ui-local

目的:
NextPatch の UI から Supabase / magic link / Auth callback 前提を削除し、SQLite ローカル単一ユーザー運用に合わせた UI へ整理する。

前提:
- 後方互換性は不要。
- Supabase を復活させない。
- ログイン画面は初期実装では廃止する。
- local-user / personal-workspace を使う。
- UI 変更は nextpatch-sqlite-migration-docs/reference/dads_app_ui_design_rules_20260411.md に従う。
- 主要目的まではなるべく 3 操作以内。
- disabled ボタンを安易に使わない。
- フォームには明確なラベル、サポートテキスト、エラーテキストを用意する。

変更前に必ず確認するファイル:
- nextpatch-sqlite-migration-docs/reference/dads_app_ui_design_rules_20260411.md
- src/app/(app)/layout.tsx
- src/app/(app)/dashboard/page.tsx
- src/app/(app)/repositories/page.tsx
- src/app/(app)/repositories/[repositoryId]/page.tsx
- src/app/(app)/work-items/page.tsx
- src/app/(app)/work-items/[workItemId]/page.tsx
- src/app/(app)/inbox/page.tsx
- src/app/(app)/capture/new/page.tsx
- src/app/(app)/ideas/page.tsx
- src/app/(app)/tech-notes/page.tsx
- src/app/(app)/references/page.tsx
- src/app/(app)/settings/page.tsx
- src/app/(app)/settings/system/page.tsx
- src/app/(auth)/login/page.tsx
- src/app/auth/callback/route.ts
- src/server/db/queries/**

作業範囲:
1. page.tsx から Supabase 直接 query を削除し、query function 呼び出しに置換する。
2. login page と auth callback route を削除、または /dashboard redirect にする。
3. layout から logout form を削除する。
4. topbar の表示を以下のように変更する。
   - ローカル運用
   - workspace name
   - Quick Capture 導線
5. settings/system を SQLite ローカル運用向けに変更する。
   - Runtime
   - Data dir
   - DB path
   - Export dir
   - DB file exists
   - WAL mode 注意
   - LAN 公開時の注意
6. settings/page の DB/Auth/SMTP 文言を削除する。
7. UI 内の Supabase / magic link / service role / anon key / SMTP for Auth 文言を削除する。
8. 主要導線を確認する。
   - Dashboard -> Quick Capture: 1 操作
   - Dashboard -> Repositories: 1 操作
   - Repository -> Work Item 作成: 画面内で完了
   - Settings -> Data export: 2 操作以内
9. DADS ルールに沿ってフォーム文言を整理する。
   - label 必須
   - placeholder で説明しない
   - support text を具体化
   - disabled を使わない

作業しないこと:
- DB schema を変更しない。
- server actions の業務ロジックを大きく変更しない。
- Supabase 互換処理を作らない。
- UI の全面 redesign はしない。

変更後に実行すべき検証コマンド:
- pnpm typecheck
- pnpm lint
- pnpm test
- grep -R "Supabase\|supabase\|magic link\|Service role\|anon key\|SMTP" src/app src/server || true
- pnpm build
- 必要なら pnpm test:e2e

完了報告に含める内容:
- 変更した page / layout
- 削除した auth UI / route
- Supabase 文言 grep 結果
- 3 操作以内導線の確認結果
- DADS ルール上の配慮点
- 実行した検証コマンドと結果
```

---

## 5. export / backup 移行エージェント

```text
あなたは NextPatch SQLite 移行の「export / backup 移行エージェント」です。

必ず個別の git worktree で作業してください。
例:
git worktree add ../nextpatch-export-sqlite -b feature/sqlite-export-backup

目的:
JSON / CSV / Markdown export を Supabase query から SQLite query に置換し、ローカル継続運用向けの backup 方針を実装または文書化する。

前提:
- 後方互換性は不要。
- Supabase を復活させない。
- DB は SQLite。
- workspace_id scope を必ず守る。
- GitHub token や機密 credential を DB に保存しない。
- DB ファイル単体コピーを安全な backup として案内しない。

変更前に必ず確認するファイル:
- src/server/domain/export.ts
- src/server/domain/export.test.ts
- src/app/api/export/json/route.ts
- src/app/api/export/csv/route.ts
- src/app/api/export/markdown/route.ts
- src/app/(app)/settings/data/page.tsx
- src/server/db/schema.ts
- src/server/db/client.ts
- src/server/db/queries/**

作業範囲:
1. createBackupDocument() 内の Supabase query を SQLite query function に置換する。
2. export 対象 entity を SQLite schema と同期する。
3. workspace_id = personal-workspace の scope を必ず適用する。
4. workspaces は id = workspace.id で取得する。
5. export_logs を残す場合は export 実行時に insert する。
6. toMarkdownExport / toCsvExport の既存仕様を維持する。
7. JSON backup の integrity hash を維持する。
8. settings/data の注意文をローカル継続運用向けに変更する。
   - JSON export は復元可能な正本。
   - Markdown / CSV は棚卸し用。
   - SQLite DB ファイルの手動コピーは WAL に注意。
   - GitHub token 等は DB に保存しない。
9. DB file backup 機能を入れる場合は、SQLite Online Backup API または VACUUM INTO 相当を使う方針にする。
   - 実装が難しい場合は初期実装では docs / UI 注意文に留める。

作業しないこと:
- Supabase export 互換処理を残さない。
- import / restore の大規模実装はしない。
- DB schema を大きく変更しない。
- GitHub token を保存する設計を入れない。

変更後に実行すべき検証コマンド:
- pnpm typecheck
- pnpm test
- pnpm lint
- pnpm build
- grep -R "supabase\|Supabase" src/server/domain src/app/api src/app/'(app)'/settings || true

完了報告に含める内容:
- export 対象 entity 一覧
- SQLite query への置換内容
- backup 注意文の変更内容
- export test 結果
- 実行した検証コマンドと結果
- DB file backup を実装したか、文書化に留めたか
```

---

## 6. test / QA エージェント

```text
あなたは NextPatch SQLite 移行の「test / QA エージェント」です。

必ず個別の git worktree で作業してください。
例:
git worktree add ../nextpatch-sqlite-qa -b feature/sqlite-qa

目的:
SQLite 移行後の NextPatch を検証し、Supabase 削除漏れ、主要導線、DB 初期化、export、Docker 起動を確認する。

前提:
- 後方互換性は不要。
- Supabase を復活させない。
- テスト DB は本番/開発 DB と分離する。
- 作業範囲外の大規模実装はしない。
- 失敗を見つけた場合は、最小修正または統括エージェントへ差し戻し報告する。

変更前に必ず確認するファイル:
- package.json
- vitest.config.ts
- playwright.config.ts
- src/server/**/*.test.ts
- src/server/db/**
- src/server/actions/**
- src/app/**
- .env.example
- docker-compose.yml
- Dockerfile

作業範囲:
1. unit test を更新する。
2. DB migration test を追加する。
   - temp DB path を使う。
   - migration + seed が通る。
   - local-user / personal-workspace が存在する。
3. query function test を追加する。
   - repository create/list/archive
   - work item create/status update
   - quick capture
   - classify memo
   - dashboard
4. export test を更新する。
   - JSON backup
   - CSV
   - Markdown
   - contentHash
5. server action test を可能な範囲で追加・更新する。
6. e2e smoke を追加または更新する。
   - 初回起動
   - dashboard 表示
   - repository 追加
   - work item 追加
   - memo 登録
   - memo 分類
   - status 変更
   - export links
7. Supabase 削除 checklist を grep で確認する。
8. Docker compose が PostgreSQL を起動しないことを確認する。
9. SQLite DB volume 永続化を確認する。

作業しないこと:
- DB schema の大規模変更はしない。
- UI redesign はしない。
- Supabase client を戻さない。
- PostgreSQL service を戻さない。

変更後に実行すべき検証コマンド:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build
- pnpm test:e2e
- grep -R "supabase\|Supabase\|SUPABASE\|magic link\|auth.users\|row level security\|nextpatch-db\|postgres" . --exclude-dir=node_modules --exclude-dir=.git || true
- docker compose config
- docker compose build
- docker compose up -d
- docker compose down

完了報告に含める内容:
- 追加 / 更新した test
- 実行した検証コマンドと結果
- grep 結果
- Docker 検証結果
- 主要導線 smoke 結果
- 未解決 issue と再現手順
```

---

## 7. 統括エージェント

```text
あなたは NextPatch SQLite 移行の「統括エージェント」です。

目的:
Supabase 前提の NextPatch を、SQLite ローカル継続運用向け構成へ移行する実装全体を統括する。
自分で大規模実装せず、サブエージェントに個別 worktree で作業させ、成果を順序よく統合する。

重要前提:
- 後方互換性は不要。
- 既存データは 1 件もない。
- Supabase は完全削除する。
- Supabase Cloud / Supabase self-hosted / Supabase CLI local は採用しない。
- PostgreSQL コンテナは不要。
- DB は SQLite。
- 推奨構成は better-sqlite3 + Drizzle ORM + Drizzle Kit。
- 認証は初期実装では廃止し、local-user / personal-workspace を seed して使う。
- 複数ユーザー機能は今回対象外。
- UI 変更は nextpatch-sqlite-migration-docs/reference/dads_app_ui_design_rules_20260411.md に従う。
- 主要導線はなるべく 3 操作以内。
- Supabase を復活させない。
- 作業範囲外の変更をしない。

最初に行うこと:
1. main 作業ディレクトリで現状確認を行う。
   - git status
   - grep -R "supabase\|Supabase\|SUPABASE\|magic link\|auth.users\|row level security" . --exclude-dir=node_modules --exclude-dir=.git || true
   - find src -type f | sort
2. 以下のサブエージェント用に個別 git worktree と branch を作る。
   - DB設計・migration エージェント
   - Supabase削除・環境整理エージェント
   - server actions / domain query 移行エージェント
   - page.tsx / UI文言移行エージェント
   - export / backup 移行エージェント
   - test / QA エージェント
3. 各サブエージェントへ本計画の該当プロンプトを渡す。
4. サブエージェントごとの作業範囲が重なりすぎないよう調整する。

推奨 branch/worktree:
- ../nextpatch-db-sqlite / feature/sqlite-db-foundation
- ../nextpatch-remove-supabase / feature/remove-supabase-env
- ../nextpatch-actions-sqlite / feature/sqlite-actions-domain
- ../nextpatch-ui-local / feature/sqlite-ui-local
- ../nextpatch-export-sqlite / feature/sqlite-export-backup
- ../nextpatch-sqlite-qa / feature/sqlite-qa

merge 順:
1. feature/sqlite-db-foundation
2. feature/remove-supabase-env
3. feature/sqlite-actions-domain
4. feature/sqlite-ui-local
5. feature/sqlite-export-backup
6. feature/sqlite-qa

merge 時の注意:
- package.json / pnpm-lock.yaml の競合は、Supabase dependencies を削除し、SQLite/Drizzle dependencies を残す。
- src/server/auth/session.ts は local context 方針を優先する。
- src/app/(app)/layout.tsx は logout を削除し、local workspace 表示を優先する。
- settings/system は Supabase 設定表示ではなく SQLite data path 表示を優先する。
- supabase/ ディレクトリは最終的に残さない。
- docker-compose.yml は PostgreSQL service を残さない。
- page.tsx から DB client 直接操作を増やさない。
- query function 内で workspace_id scope を必ず維持する。

統合後の最終検証:
- pnpm install
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build
- 必要なら pnpm test:e2e
- pnpm db:migrate
- pnpm db:seed
- grep -R "supabase\|Supabase\|SUPABASE\|magic link\|signInWithOtp\|auth.users\|row level security\|nextpatch-db\|postgres" . --exclude-dir=node_modules --exclude-dir=.git || true
- docker compose config
- docker compose build
- docker compose up -d
- docker compose down

最終成果物 zip:
1. 統合後の repository root で成果物 zip を作る。
2. node_modules, .next, data, exports, backups, coverage, test-results, playwright-report, .git は含めない。
3. zip 名は例:
   - nextpatch-sqlite-migration-implementation.zip
4. zip に含めるべきもの:
   - src/
   - drizzle/
   - nextpatch-sqlite-migration-docs/
   - drizzle.config.ts
   - package.json
   - pnpm-lock.yaml
   - .env.example
   - .gitignore
   - .dockerignore
   - Dockerfile
   - docker-compose.yml
   - next.config.ts
   - tsconfig.json
   - vitest.config.ts
   - playwright.config.ts
5. zip に含めないもの:
   - supabase/
   - node_modules/
   - .next/
   - data/
   - exports/
   - backups/
   - SQLite DB / WAL / SHM files
   - .env
   - PostgreSQL volume

完了報告に含める内容:
- merge した branch 一覧と順序
- コンフリクトと解決内容
- 最終的に削除された Supabase 関連
- 採用した SQLite 構成
- 認証廃止 / local-user 方針
- Docker 方針
- 実行した検証コマンドと結果
- grep 結果
- Docker 起動結果
- 作成した zip のパス
- 残課題
```
