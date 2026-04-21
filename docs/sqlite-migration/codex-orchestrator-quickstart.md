# NextPatch SQLite 移行 Codex 統括クイックスタート

このファイルは、統括エージェントがサブエージェントを起動して統合するための短縮手順です。
詳細は `nextpatch-sqlite-migration-plan.md` と `agent-prompts.md` を参照してください。

## 1. 初期確認

```bash
git status
grep -R "supabase\|Supabase\|SUPABASE\|magic link\|auth.users\|row level security" . --exclude-dir=node_modules --exclude-dir=.git || true
find src -type f | sort
```

## 2. worktree 作成

```bash
git worktree add ../nextpatch-db-sqlite -b feature/sqlite-db-foundation
git worktree add ../nextpatch-remove-supabase -b feature/remove-supabase-env
git worktree add ../nextpatch-actions-sqlite -b feature/sqlite-actions-domain
git worktree add ../nextpatch-ui-local -b feature/sqlite-ui-local
git worktree add ../nextpatch-export-sqlite -b feature/sqlite-export-backup
git worktree add ../nextpatch-sqlite-qa -b feature/sqlite-qa
```

## 3. サブエージェントへ渡すプロンプト

`agent-prompts.md` から以下をコピーして渡します。

1. DB設計・migration エージェント
2. Supabase削除・環境整理エージェント
3. server actions / domain query 移行エージェント
4. page.tsx / UI文言移行エージェント
5. export / backup 移行エージェント
6. test / QA エージェント

## 4. 推奨 merge 順

```bash
git checkout main

git merge --no-ff feature/sqlite-db-foundation
git merge --no-ff feature/remove-supabase-env
git merge --no-ff feature/sqlite-actions-domain
git merge --no-ff feature/sqlite-ui-local
git merge --no-ff feature/sqlite-export-backup
git merge --no-ff feature/sqlite-qa
```

## 5. merge conflict 方針

| ファイル | 優先方針 |
|---|---|
| `package.json` / `pnpm-lock.yaml` | Supabase dependency を削除し、SQLite/Drizzle dependency を残す |
| `src/server/auth/session.ts` | `requireLocalContext()` 方針を優先 |
| `src/app/(app)/layout.tsx` | logout を削除し、local workspace 表示を優先 |
| `src/app/(app)/settings/system/page.tsx` | Supabase 設定表示ではなく SQLite data path 表示を優先 |
| `docker-compose.yml` | PostgreSQL service を残さない |
| `supabase/**` | 最終的に削除 |

## 6. 最終検証

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
pnpm db:seed

# 必要なら
pnpm test:e2e

grep -R "supabase\|Supabase\|SUPABASE\|magic link\|signInWithOtp\|auth.users\|row level security\|nextpatch-db\|postgres" . --exclude-dir=node_modules --exclude-dir=.git || true

docker compose config
docker compose build
docker compose up -d
docker compose down
```

## 7. 最終 zip 作成例

```bash
zip -r nextpatch-sqlite-migration-implementation.zip . \
  -x ".git/*" \
  -x "node_modules/*" \
  -x ".next/*" \
  -x "data/*" \
  -x "exports/*" \
  -x "backups/*" \
  -x "coverage/*" \
  -x "test-results/*" \
  -x "playwright-report/*" \
  -x "*.sqlite" \
  -x "*.sqlite-wal" \
  -x "*.sqlite-shm" \
  -x "*.db" \
  -x "*.db-wal" \
  -x "*.db-shm" \
  -x ".env" \
  -x ".env.local"
```

## 8. 完了報告テンプレート

```text
## 完了報告

### merge した branch
- feature/sqlite-db-foundation
- feature/remove-supabase-env
- feature/sqlite-actions-domain
- feature/sqlite-ui-local
- feature/sqlite-export-backup
- feature/sqlite-qa

### コンフリクトと解決
- ...

### Supabase 削除結果
- ...

### SQLite 構成
- better-sqlite3 + Drizzle ORM + Drizzle Kit
- DB path: ...
- seed: local-user / personal-workspace

### 検証結果
- pnpm lint: pass/fail
- pnpm typecheck: pass/fail
- pnpm test: pass/fail
- pnpm build: pass/fail
- Docker: pass/fail
- grep: ...

### 成果物 zip
- path: ...

### 残課題
- ...
```
