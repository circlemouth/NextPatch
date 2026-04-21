# NextPatch SQLite 移行 作業計画

## 0. 前提

- この文書は実装前の作業計画であり、コード変更そのものではない。
- 後方互換性は不要。
- 運用開始前であり、既存データは 1 件もない。
- Supabase は完全に切り捨てる。
- Supabase Cloud / Supabase self-hosted / Supabase CLI local は採用しない。
- PostgreSQL コンテナも不要にする。
- SQLite ローカル単一 DB ファイル運用を第一候補ではなく採用方針とする。
- UI 変更は `nextpatch-sqlite-migration-docs/reference/dads_app_ui_design_rules_20260411.md` に従う。
- UI 操作は主要目的までなるべく 3 操作以内で到達できるようにする。

---

## 1. 結論

### 採用する SQLite 構成

**`better-sqlite3` + Drizzle ORM + Drizzle Kit migration** を採用する。

理由:

- Next.js Server Components / Server Actions からローカル DB を扱いやすい。
- SQLite 単一 DB ファイル運用に向いている。
- TypeScript で schema と query function を近くに置ける。
- Supabase fluent query から repository/query layer へ置換しやすい。
- Prisma より軽量で、手書き SQL より型安全性と migration 管理がしやすい。

| 候補 | 利点 | 欠点 | 判定 |
|---|---|---|---|
| `better-sqlite3` + Drizzle ORM | 型安全、SQL に近い、migration 管理可能、Next.js server 側から使いやすい | native dependency 対応が必要 | **採用** |
| `better-sqlite3` + 手書き SQL | 依存が少ない、SQLite を直接制御しやすい | 型安全性、migration、保守性が弱い | 不採用 |
| Prisma + SQLite | schema 管理が強い、将来 DB 変更に強い | 今回の規模では重め、Prisma Client 生成が必要 | 不採用 |

### Supabase 削除方針

Supabase は完全削除する。互換 wrapper や将来復活用 client は作らない。

削除対象:

- `@supabase/ssr`
- `@supabase/supabase-js`
- `src/server/supabase/`
- `src/app/auth/callback/route.ts`
- Supabase magic link 前提の login UI / auth action
- `.env.example` 内の Supabase env / Supabase Auth 用 SMTP env
- `supabase/` ディレクトリ
- `docker-compose.yml` の PostgreSQL service
- UI 上の Supabase / magic link / service role / anon key 文言

### 認証・ローカルユーザー方針

初期実装では **ログイン画面を廃止し、ローカル単一ユーザーとして扱う**。

- `local-user` を自動 seed する。
- `personal-workspace` を自動 seed する。
- `user_id` と `workspace_id` は将来拡張と移行容易性のため残す。
- ただし複数ユーザー機能は今回対象外。
- `requireSession()` は `requireLocalContext()` へ置換する。
- DB client を session return value に含めない。
- 画面や actions は query function / command function 経由で DB を使う。

LAN 公開時の保護は将来の local access key / 管理パスワード方式で扱う。初期実装では README / settings/system で「localhost または信頼済み LAN で使う」注意を表示する。

### Docker 方針

- PostgreSQL service は削除。
- web service のみを基本にする。
- SQLite data volume を `/app/data` に mount する。
- Docker env:
  - `NEXTPATCH_DATA_DIR=/app/data`
  - `NEXTPATCH_DB_PATH=/app/data/nextpatch.sqlite`
  - `NEXTPATCH_EXPORT_DIR=/app/data/exports`
- `better-sqlite3` native dependency のため Docker build を必ず検証する。

---

## 2. 現状の Supabase 依存箇所

| ファイル / ディレクトリ | 依存内容 | 移行後の扱い |
|---|---|---|
| `package.json` | `@supabase/ssr`, `@supabase/supabase-js` | 削除。Drizzle / SQLite 関連 dependency を追加。 |
| `pnpm-lock.yaml` | Supabase 依存 lock | `pnpm install` で更新。 |
| `.env.example` | Supabase URL / anon key / service role / SMTP | 全削除。SQLite local runtime 用 env に置換。 |
| `src/server/supabase/server.ts` | Supabase server client / service role client | 削除。 |
| `src/server/auth/session.ts` | Supabase Auth `getUser()`, workspace membership query | `requireLocalContext()` に置換。 |
| `src/server/actions/auth.ts` | magic link login / Supabase sign out | 削除。 |
| `src/app/auth/callback/route.ts` | Supabase Auth callback | 削除。 |
| `src/app/(auth)/login/page.tsx` | Supabase magic link login UI | 削除または `/dashboard` redirect。 |
| `src/app/(app)/**/page.tsx` | `requireSession()` 経由で Supabase client を直接 query | query function 呼び出しに置換。 |
| `src/server/actions/**` | Supabase fluent query による insert/update/select | command function に置換。 |
| `src/server/domain/dashboard.ts` | Supabase relational select | SQLite join + mapper に置換。 |
| `src/server/domain/export.ts` | Supabase query で export | SQLite query に置換。 |
| `src/app/(app)/settings/system/page.tsx` | Supabase URL / anon key / service role 表示 | SQLite DB path / data dir / WAL / runtime 表示へ変更。 |
| `supabase/config.toml` | Supabase local config | 削除。 |
| `supabase/migrations/202604200001_initial_schema.sql` | PostgreSQL enum, auth.users, RLS, policies, pgcrypto | 削除。後方互換不要なので移行元資料としても原則不要。 |
| `docker-compose.yml` | `nextpatch-db` PostgreSQL service | PostgreSQL service 削除。SQLite volume 追加。 |
| `.gitignore` | Supabase temp ignore | SQLite DB / WAL / SHM / backup / exports / data を追加。 |
| `.dockerignore` | Supabase temp ignore | data / exports / SQLite DB を除外。 |

---

## 3. 移行後アーキテクチャ

### ディレクトリ構成案

```text
.
├─ drizzle.config.ts
├─ drizzle/
│  └─ 0000_initial_sqlite.sql
├─ data/                         # 開発用。gitignore 対象
├─ nextpatch-sqlite-migration-docs/
├─ src/
│  └─ server/
│     ├─ auth/
│     │  └─ session.ts            # requireLocalContext
│     └─ db/
│        ├─ client.ts             # SQLite / Drizzle singleton
│        ├─ paths.ts              # data dir / db path 解決
│        ├─ schema.ts             # Drizzle schema
│        ├─ migrate.ts            # migration runner
│        ├─ seed.ts               # local-user / personal-workspace
│        ├─ backup.ts             # DB backup helper
│        └─ queries/
│           ├─ context.ts
│           ├─ repositories.ts
│           ├─ work-items.ts
│           ├─ dashboard.ts
│           ├─ export.ts
│           ├─ classification.ts
│           ├─ tech-notes.ts
│           └─ references.ts
└─ supabase/                      # 削除
```

### DB 接続

- `src/server/db/client.ts` で `better-sqlite3` connection と Drizzle instance を作る。
- DB path は `src/server/db/paths.ts` で解決する。
- デフォルト:
  - `NEXTPATCH_DATA_DIR=./data`
  - `NEXTPATCH_DB_PATH=./data/nextpatch.sqlite`
  - `NEXTPATCH_EXPORT_DIR=./data/exports`
- DB 初期化時:
  - data dir 作成
  - `PRAGMA foreign_keys = ON`
  - `PRAGMA journal_mode = WAL`
  - `PRAGMA busy_timeout = 5000`

### migration

- `drizzle.config.ts` を追加。
- `drizzle/0000_initial_sqlite.sql` を作る。
- package scripts:
  - `db:generate`
  - `db:migrate`
  - `db:seed`
  - `db:reset:dev`
- 初期実装では、アプリ起動時に勝手に migration するより、`pnpm db:migrate && pnpm db:seed` を明示実行する方針を推奨する。

### seed

固定 seed:

- `local_users.id = "local-user"`
- `workspaces.id = "personal-workspace"`
- `workspace_members.user_id = "local-user"`
- `workspace_members.role = "owner"`

### query layer

画面や Server Actions から DB client を直接触らない。

- `page.tsx` は `listRepositories()` などの query function のみ呼ぶ。
- Server Actions は command function のみ呼ぶ。
- 全 query / command は `workspace_id` scope を必ず持つ。
- insert/update/delete は transaction を使う。
- Supabase relational select は join / 複数 query / mapper に置換する。

### session / local context

`requireSession()` は `requireLocalContext()` に置換する。

返り値例:

```ts
{
  user: { id: "local-user", email: null, displayName: "Local user" },
  workspace: { id: "personal-workspace", name: "Personal workspace" }
}
```

DB client は返さない。

### export / backup

- JSON / CSV / Markdown export は継続。
- export data は SQLite query layer から取得。
- SQLite DB ファイル自体の backup は WAL に注意する。
- 初期実装では JSON export を安全な正本 backup として案内する。
- DB file backup を実装する場合は `VACUUM INTO` または Online Backup API 相当を検討する。

### Docker volume

```yaml
services:
  nextpatch-web:
    volumes:
      - nextpatch_data:/app/data
    environment:
      NEXTPATCH_DATA_DIR: /app/data
      NEXTPATCH_DB_PATH: /app/data/nextpatch.sqlite
      NEXTPATCH_EXPORT_DIR: /app/data/exports

volumes:
  nextpatch_data:
```

---

## 4. スキーマ変換方針

### 共通変換ルール

| PostgreSQL / Supabase | SQLite 方針 |
|---|---|
| `uuid` | `text` |
| `gen_random_uuid()` | アプリ層で `crypto.randomUUID()` |
| `timestamptz` | ISO8601 `text` |
| `date` | `YYYY-MM-DD` の `text` |
| PostgreSQL enum | `text` + CHECK 制約、または app validation |
| `boolean` | SQLite `integer` boolean |
| `auth.users` FK | 削除、または `local_users` へ置換 |
| RLS / policy / `auth.uid()` | 全削除 |
| `pgcrypto` | 不要 |
| `updated_at` trigger | 初期実装では app 層更新。必要なら SQLite trigger |
| foreign key | `PRAGMA foreign_keys = ON` を必須化 |
| partial index | SQLite partial index へ移植可能なもののみ移植 |

### 主要 CHECK 制約候補

- `repository_provider in ('manual', 'github')`
- `production_status in ('planning', 'development', 'active_production', 'maintenance', 'paused')`
- `criticality in ('high', 'medium', 'low')`
- `work_item_scope in ('repository', 'inbox', 'global')`
- `work_item_type in ('task', 'bug', 'idea', 'implementation', 'future_feature', 'memo')`
- `priority_level in ('p0', 'p1', 'p2', 'p3', 'p4')`
- `source_type in ('manual', 'chatgpt', 'github', 'web', 'import', 'system')`
- `privacy_level in ('normal', 'confidential', 'secret', 'no_ai')`
- `workspace_role in ('owner', 'member')`

### 主要テーブルごとの変更点

| テーブル | SQLite 移行方針 |
|---|---|
| `local_users` | 新設。`local-user` の最小 user table。 |
| `workspaces` | `id text primary key`, `owner_user_id text`, `created_at/updated_at text`。 |
| `workspace_members` | 将来拡張用に残す。初期 seed は `local-user` owner のみ。 |
| `repositories` | `user_id`, `workspace_id` 維持。boolean は integer。 |
| `repository_versions` | `target_date text`。repository FK の循環に注意。 |
| `work_items` | `workspace_id` 必須。status / priority / type は text CHECK。 |
| `bug_details` | `work_item_id unique` 維持。 |
| `ideas` | `work_item_id unique`, `promoted_work_item_id` FK 維持。 |
| `tech_notes` | credential は保存しない。 |
| `reference_services` | 既存通り。 |
| `tags` | `unique(workspace_id, name)` 維持。 |
| `work_item_tags` | `unique(work_item_id, tag_id)` 維持。 |
| `status_histories` | status update transaction 内で insert。 |
| `classification_candidates` | quick capture / classify memo で使用。 |
| `export_logs` | export 実行記録として維持可能。 |
| `import_jobs` | 後方互換不要のため削除候補。UI が必要なら残す。 |

---

## 5. 実装工程表

### Phase 0: 事前棚卸し

- 目的: Supabase 依存箇所を確定する。
- 対象: 全体、特に `package.json`, `.env.example`, `src/server/supabase`, `src/server/auth/session.ts`, `src/app/(app)/**`, `supabase/**`, `docker-compose.yml`。
- 具体作業:
  - `grep -R "supabase\|Supabase\|magic link\|auth.users" .` を実行。
  - Supabase migration から table / enum / index を抽出。
- 完了条件: 削除対象と置換対象が一覧化されている。
- リスク: page.tsx の Supabase query 見落とし。
- 検証: grep 結果と本計画の表を照合。

### Phase 1: DB 基盤導入

- 目的: SQLite / Drizzle の土台を作る。
- 対象: `package.json`, `pnpm-lock.yaml`, `drizzle.config.ts`, `drizzle/**`, `src/server/db/**`。
- 具体作業:
  - Supabase package 削除。
  - Drizzle / better-sqlite3 追加。
  - DB path 解決、client、schema、migrate、seed を実装。
- 完了条件: `pnpm db:migrate`, `pnpm db:seed` で空 DB を作成できる。
- リスク: native dependency、Docker build、migration 差分。
- 検証: `pnpm install`, `pnpm typecheck`, `pnpm db:migrate`, `pnpm db:seed`。

### Phase 2: local context / 認証削除

- 目的: Supabase Auth を削除し local context に置換する。
- 対象: `src/server/auth/session.ts`, `src/server/actions/auth.ts`, `src/app/(auth)/login/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/(app)/layout.tsx`, `src/app/page.tsx`。
- 具体作業:
  - `requireSession()` を `requireLocalContext()` に変更。
  - login / callback / auth actions を削除。
  - logout UI を削除。
- 完了条件: `/login` と `/auth/callback` が不要。
- リスク: LAN 公開時の保護不足。
- 検証: `pnpm typecheck`, grep。

### Phase 3: query layer 実装

- 目的: 画面と actions から DB 直接操作を排除する。
- 対象: `src/server/db/queries/**`, `src/server/domain/dashboard.ts`。
- 具体作業:
  - repositories / work-items / dashboard / export / classification / tech-notes / references の query/command を作る。
  - 全 query に `workspace_id` 条件を入れる。
- 完了条件: 主要画面・actions に必要な DTO を返せる。
- リスク: relational select の join 置換ミス。
- 検証: query function unit test、DB fixture test。

### Phase 4: Server Actions 移行

- 目的: Supabase fluent query を command function に置換する。
- 対象: `src/server/actions/repositories.ts`, `work-items.ts`, `capture.ts`, `classification.ts`。
- 具体作業:
  - `createRepository`, `archiveRepository`, `createWorkItem`, `updateWorkItemStatus`, `quickCapture`, `classifyMemo` を置換。
  - status history / classification candidate を transaction 化。
- 完了条件: actions から `supabase` 変数が消える。
- リスク: partial insert、status history 漏れ。
- 検証: server action test、grep。

### Phase 5: page.tsx / UI 移行

- 目的: UI の Supabase query と Supabase 文言を削除する。
- 対象: `src/app/(app)/**/page.tsx`, `layout.tsx`, settings。
- 具体作業:
  - 各 page を query function 呼び出しへ変更。
  - system settings を SQLite 表示へ変更。
  - login/logout 導線削除。
- 完了条件: UI に Supabase 文言が残らない。
- リスク: DTO 不足、導線悪化。
- 検証: e2e smoke、grep。

### Phase 6: export / backup 移行

- 目的: JSON / CSV / Markdown export を SQLite query へ置換する。
- 対象: `src/server/domain/export.ts`, `src/server/db/queries/export.ts`, `src/server/db/backup.ts`, `src/app/api/export/**`, `settings/data`。
- 具体作業:
  - export data を SQLite query に置換。
  - export_logs 記録。
  - DB file backup の注意文をローカル運用向けに変更。
- 完了条件: JSON / CSV / Markdown export が動作。
- リスク: WAL mode で DB ファイル単体コピーを安全 backup と誤認させる。
- 検証: export test、download headers、content hash。

### Phase 7: Docker / env 整理

- 目的: PostgreSQL / Supabase 前提を環境から削除する。
- 対象: `.env.example`, `.gitignore`, `.dockerignore`, `Dockerfile`, `docker-compose.yml`, README 相当。
- 具体作業:
  - SQLite env 追加。
  - PostgreSQL service 削除。
  - data volume 追加。
  - Docker build 検証。
- 完了条件: DB コンテナなしで Docker compose 起動。
- リスク: `better-sqlite3` build failure。
- 検証: `docker compose build`, `docker compose up`。

### Phase 8: Test / QA

- 目的: 移行後の主要導線と削除漏れを検証する。
- 対象: tests, e2e, 全 repo。
- 具体作業:
  - unit / DB / query / server action / export / e2e smoke を追加・更新。
  - grep checklist 実行。
- 完了条件: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` が通る。
- リスク: test DB と dev DB の混線。
- 検証: `NEXTPATCH_DB_PATH` を temp path にして実行。

---

## 6. サブエージェント分割案

| エージェント | 役割 | 作業対象 | 作業しないこと | 依存関係 | 成果物 | merge 順 | コンフリクト注意点 |
|---|---|---|---|---|---|---:|---|
| 統括エージェント | worktree / branch 管理、merge、最終検証、zip 作成 | 全体 | 大規模実装 | 全 agent | 統合 branch / zip | 統括 | package, layout, settings |
| DB設計・migration | SQLite / Drizzle 基盤 | `src/server/db/**`, `drizzle/**`, package | UI 大規模変更 | 先行 | DB 初期化基盤 | 1 | package, lockfile |
| Supabase削除・環境整理 | Supabase env/config/auth/docker 削除 | `.env.example`, `supabase/**`, `docker-compose.yml` | schema 詳細実装 | DB agent と調整 | Supabase 依存削除 | 2 | package, deleted files |
| server actions / domain query | actions/domain を SQLite query に移行 | `src/server/actions/**`, `domain/**`, `queries/**` | UI 文言整理 | DB agent | core mutations | 3 | session, DTO |
| page.tsx / UI文言 | page.tsx query 置換、UI 文言整理 | `src/app/**` | DB schema 変更 | query layer | Supabase 文言なし UI | 4 | layout, settings |
| export / backup | export と backup 方針 | `export.ts`, export routes, settings/data | core schema 再設計 | DB / query layer | export 動作 | 5 | export DTO |
| test / QA | test, grep, Docker smoke | tests, scripts, 全体 | 大規模実装 | 全実装後 | QA report | 6 | fixture DB path |

---

## 7. サブエージェント用プロンプト集

詳細プロンプトは `agent-prompts.md` に分離して収録する。統括エージェントは、各サブエージェントに必ず以下を守らせる。

- 個別の git worktree で作業すること。
- 変更前に対象ファイルを確認すること。
- Supabase を復活させないこと。
- 作業範囲外の変更をしないこと。
- 変更後に検証コマンドを実行すること。
- 完了報告に変更点、検証結果、未解決リスクを含めること。

---

## 8. 統括エージェント用プロンプト

詳細プロンプトは `agent-prompts.md` に収録する。統括エージェントの責務は以下。

- サブエージェントの起動。
- branch / worktree 管理。
- merge 順序管理。
- コンフリクト解消。
- 最終検証。
- 成果物 zip 作成。
- 自分で大規模実装しない。

merge 順:

1. `feature/sqlite-db-foundation`
2. `feature/remove-supabase-env`
3. `feature/sqlite-actions-domain`
4. `feature/sqlite-ui-local`
5. `feature/sqlite-export-backup`
6. `feature/sqlite-qa`

---

## 9. 削除チェックリスト

詳細は `checklists.md` に分離して収録する。

主要確認:

- package dependencies に Supabase がない。
- env example に Supabase env がない。
- UI 文言に Supabase magic link がない。
- auth callback route がない。
- Supabase migration/config がない。
- docker-compose に PostgreSQL service がない。
- `grep -R "supabase\|Supabase" .` で意図しない残存がない。

---

## 10. 検証チェックリスト

詳細は `checklists.md` に分離して収録する。

主要検証:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`
- SQLite DB 初期化
- 初回起動
- リポジトリ追加
- 作業項目追加
- メモ登録
- メモ分類
- ステータス変更
- JSON / CSV / Markdown export
- Docker compose 起動
- DB volume 永続化確認

---

## 11. リスクと対策

| リスク | 内容 | 対策 |
|---|---|---|
| SQLite native dependency | `better-sqlite3` build failure | Docker build を早期検証。必要なら build tools または Debian slim base。 |
| Next.js runtime compatibility | Edge runtime では SQLite native dependency が使えない | DB 使用箇所は Node.js runtime。 |
| DB connection 管理 | hot reload / request で connection 多重化 | singleton 管理。 |
| concurrent write | SQLite writer は同時 1 つ | 短い transaction、busy_timeout、WAL。 |
| migration 失敗 | local DB を壊す危険 | migrate 前 backup、migration test。 |
| Supabase schema 差分 | enum / RLS / trigger / auth.users がない | 後方互換不要なので SQLite schema を新規設計。 |
| RLS 不在 | SQLite に RLS はない | local single user + query layer workspace scope。 |
| 認証削除 | LAN 公開時に危険 | localhost / trusted LAN 前提を明示。将来 access key。 |
| backup 漏れ | DB file 単体コピーが危険 | JSON export を正本にし、DB backup は `VACUUM INTO` 等。 |
| GitHub token 保存 | credential 流出 | DB に保存しない。OS credential store / keychain / env 優先。 |
| test DB 混線 | dev DB を破壊 | temp path / `NEXTPATCH_DB_PATH` を必須化。 |
| Supabase 残存 | package/env/UI/docs に残る | grep checklist を最終 QA で実施。 |

---

## 12. 最終成果物イメージ

### 残るべきもの

```text
.
├─ drizzle.config.ts
├─ drizzle/
├─ nextpatch-sqlite-migration-docs/
├─ src/server/db/
├─ src/server/auth/session.ts      # local context
├─ src/server/actions/             # SQLite command function 経由
├─ src/server/domain/              # SQLite query / mapper 経由
├─ .env.example                    # SQLite env
├─ docker-compose.yml              # web + SQLite volume
└─ package.json                    # Drizzle / better-sqlite3
```

### 消えるべきもの

```text
supabase/
src/server/supabase/
src/app/auth/callback/route.ts
src/app/(auth)/login/page.tsx
```

加えて、以下が消える。

- `@supabase/ssr`
- `@supabase/supabase-js`
- Supabase env
- Supabase Auth SMTP env
- PostgreSQL Docker service
- Supabase magic link UI
- `auth.users`
- RLS / policy / `auth.uid()`
- `pgcrypto`

### `.env.example` 最終イメージ

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXTPATCH_RUNTIME_MODE=local-server
NEXTPATCH_DATA_DIR=./data
NEXTPATCH_DB_PATH=./data/nextpatch.sqlite
NEXTPATCH_EXPORT_DIR=./data/exports
```

### 最終 zip に含めるもの

- repository source
- `nextpatch-sqlite-migration-docs/**`
- `drizzle/**`
- config files
- tests

### 最終 zip に含めないもの

- `.git/`
- `node_modules/`
- `.next/`
- `data/`
- `exports/`
- `backups/`
- SQLite DB / WAL / SHM files
- `.env`
- `supabase/`
