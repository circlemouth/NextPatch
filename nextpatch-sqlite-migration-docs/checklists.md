# NextPatch SQLite 移行 チェックリスト

## 1. Supabase 削除チェックリスト

- [ ] `package.json` に `@supabase/ssr` がない。
- [ ] `package.json` に `@supabase/supabase-js` がない。
- [ ] `pnpm-lock.yaml` に Supabase package が残っていない。
- [ ] `src/server/supabase/` が存在しない。
- [ ] `src/server/supabase/server.ts` が存在しない。
- [ ] `src/app/auth/callback/route.ts` が存在しない。
- [ ] `src/app/(auth)/login/page.tsx` が存在しない、または `/dashboard` redirect のみ。
- [ ] `src/server/actions/auth.ts` が存在しない、または Supabase Auth を含まない。
- [ ] `signInWithOtp` が残っていない。
- [ ] Supabase Auth としての `signOut` が残っていない。
- [ ] `magic link` 文言が UI に残っていない。
- [ ] `Supabase Auth` 文言が UI に残っていない。
- [ ] `NEXT_PUBLIC_SUPABASE_URL` が `.env.example` に残っていない。
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` が `.env.example` に残っていない。
- [ ] `SUPABASE_SERVICE_ROLE_KEY` が `.env.example` に残っていない。
- [ ] Supabase Auth 用 `SMTP_*` 説明が `.env.example` に残っていない。
- [ ] `supabase/config.toml` が存在しない。
- [ ] `supabase/migrations/` が存在しない。
- [ ] `auth.users` が migration / schema に残っていない。
- [ ] RLS / policy / `auth.uid()` が schema に残っていない。
- [ ] `pgcrypto` が残っていない。
- [ ] `docker-compose.yml` に `nextpatch-db` がない。
- [ ] `docker-compose.yml` に `postgres` image がない。
- [ ] `docker-compose.yml` に PostgreSQL volume がない。
- [ ] `settings/system` に Supabase URL / anon key / service role 表示がない。

### grep コマンド

```bash
grep -R "supabase\|Supabase\|SUPABASE" . --exclude-dir=node_modules --exclude-dir=.git || true
grep -R "magic link\|signInWithOtp\|auth/callback\|auth.users\|row level security\|pgcrypto" . --exclude-dir=node_modules --exclude-dir=.git || true
grep -R "postgres\|nextpatch-db" docker-compose.yml .env.example || true
```

意図しない残存は 0 件にする。

---

## 2. コマンド検証チェックリスト

- [ ] `pnpm install`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] 必要なら `pnpm test:e2e`
- [ ] `pnpm db:migrate`
- [ ] `pnpm db:seed`
- [ ] `docker compose config`
- [ ] `docker compose build`
- [ ] `docker compose up -d`
- [ ] `docker compose down`

---

## 3. SQLite 初期化チェックリスト

- [ ] `NEXTPATCH_DATA_DIR` が未指定でも `./data` を使う。
- [ ] `NEXTPATCH_DB_PATH` が未指定でも `./data/nextpatch.sqlite` を使う。
- [ ] data dir が自動作成される。
- [ ] migration が通る。
- [ ] seed が通る。
- [ ] `local-user` が作成される。
- [ ] `personal-workspace` が作成される。
- [ ] `workspace_members` に owner が作成される。
- [ ] `PRAGMA foreign_keys` が有効。
- [ ] WAL mode が有効。
- [ ] DB / WAL / SHM が git 管理されない。

---

## 4. 主要導線 smoke checklist

- [ ] 初回起動。
- [ ] `/` から `/dashboard` へ遷移。
- [ ] `/dashboard` 表示。
- [ ] Quick Capture へ 1 操作で到達。
- [ ] リポジトリ一覧へ 1 操作で到達。
- [ ] リポジトリ追加。
- [ ] リポジトリ詳細表示。
- [ ] 作業項目追加。
- [ ] 作業項目一覧表示。
- [ ] 作業項目詳細表示。
- [ ] ステータス変更。
- [ ] メモ登録。
- [ ] inbox 表示。
- [ ] メモ分類。
- [ ] dashboard priority 表示。
- [ ] ideas 表示。
- [ ] tech notes 表示。
- [ ] references 表示。
- [ ] settings/data 表示。
- [ ] settings/system 表示。

---

## 5. export checklist

- [ ] JSON export。
- [ ] CSV export。
- [ ] Markdown export。
- [ ] JSON `format = "nextpatch.backup"`。
- [ ] JSON `schemaVersion` が期待値。
- [ ] `integrity.counts` が実データ数と一致。
- [ ] `contentHash` が生成される。
- [ ] CSV が work_items を含む。
- [ ] Markdown が repositories / work items を含む。
- [ ] export UI の注意文がローカル継続運用向け。
- [ ] GitHub token や credential を DB/export に含めない方針が明記されている。

---

## 6. Docker checklist

- [ ] PostgreSQL service が起動しない。
- [ ] `/app/data` volume が mount される。
- [ ] コンテナ再起動後も DB が残る。
- [ ] `NEXTPATCH_DB_PATH=/app/data/nextpatch.sqlite` で動く。
- [ ] export dir が volume 内に作成される。
- [ ] Docker build で native dependency が解決する。

---

## 7. UI / DADS checklist

- [ ] UI から Supabase / magic link / service role / anon key / SMTP 文言が消えている。
- [ ] 主要導線は 3 操作以内。
- [ ] フォームに label がある。
- [ ] placeholder を説明文の代用にしていない。
- [ ] support text が簡潔かつ具体的。
- [ ] error text が何をどう直すかを示している。
- [ ] disabled button を安易に使っていない。
- [ ] primary button は原則 1 画面 1 個。
- [ ] 重要情報を accordion / disclosure に隠していない。
- [ ] settings/system に local runtime / DB path / backup 注意 / LAN 公開注意がある。

---

## 8. 最終成果物 zip checklist

- [ ] zip に `nextpatch-sqlite-migration-docs/**` が含まれる。
- [ ] zip に `src/**` が含まれる。
- [ ] zip に `drizzle/**` が含まれる。
- [ ] zip に `package.json`, `pnpm-lock.yaml`, `.env.example`, `docker-compose.yml` が含まれる。
- [ ] zip に `.git/` が含まれない。
- [ ] zip に `node_modules/` が含まれない。
- [ ] zip に `.next/` が含まれない。
- [ ] zip に `data/`, `exports/`, `backups/` が含まれない。
- [ ] zip に SQLite DB / WAL / SHM files が含まれない。
- [ ] zip に `.env` が含まれない。
- [ ] zip に `supabase/` が含まれない。
