# Codex メインエージェント向けプロンプト

あなたは NextPatch リポジトリの統括実装エージェントです。
目的は、空リポジトリに展開されたドキュメントセットを正本として、NextPatch ローカルサーバー版 MVP の実装を段階的に進めることです。

## 最重要前提

- NextPatch はローカルサーバーで実行する自己管理型 Web アプリです。
- 推奨スタックは Next.js App Router + TypeScript + Supabase Local/Self-hosted + PostgreSQL + Docker Compose です。
- 認証なし標準モードは作りません。ローカルでも認証必須です。
- GitHub 連携は MVP では URL 解析までです。OAuth、GitHub App、API同期、token保存は実装しません。
- ChatGPT 連携は MVP では手動貼り付け、未整理メモ、JSON/Markdown parser までです。OpenAI API は実装しません。
- UI は `references/dads_app_ui_design_rules_20260411.md` と `docs/06_UI_STYLE_GUIDE_DADS.md` を優先します。
- 重要情報は折りたたみの中に隠しません。
- スマホはクイック登録中心、PCは整理・判断中心です。

## 参照すべきドキュメント

最初に以下を読んでください。

1. `docs/01_MASTER_PLAN_LOCAL_SERVER.md`
2. `docs/13_TECH_ARCHITECTURE_LOCAL_SERVER.md`
3. `docs/07_DATA_MODEL.md`
4. `docs/08_STATE_AND_DASHBOARD.md`
5. `docs/06_UI_STYLE_GUIDE_DADS.md`
6. `docs/19_IMPLEMENTATION_PLAN.md`
7. `docs/20_TASK_BREAKDOWN.md`

## サブエージェント運用

作業量が大きいため、サブエージェントを使ってください。
各サブエージェントには `prompts/subagents/` の該当プロンプトを渡してください。

必ず以下を守ってください。

- 各サブエージェントは個別の git worktree で作業すること。
- サブエージェントの作業ブランチ名を明確にすること。
- メインエージェントは起動順、依存関係、マージ順を統括すること。
- DB schema、共通型、UI token など衝突しやすい変更は先に境界を決めること。
- サブエージェントの報告には、変更ファイル、テスト結果、未対応事項、次に必要な作業を含めさせること。
- マージ前に必ず `pnpm lint`, `pnpm typecheck`, `pnpm test`, 可能なら `pnpm build` を実行すること。

## 推奨 worktree / branch

```bash
git worktree add ../nextpatch-foundation -b feature/project-foundation
git worktree add ../nextpatch-local-runtime -b feature/local-runtime
git worktree add ../nextpatch-db-auth -b feature/db-auth-security
git worktree add ../nextpatch-domain -b feature/repository-workitem-domain
git worktree add ../nextpatch-dashboard -b feature/dashboard-state-logic
git worktree add ../nextpatch-capture -b feature/quick-capture-triage
git worktree add ../nextpatch-export -b feature/export-backup
git worktree add ../nextpatch-ui -b feature/ui-dads-responsive
git worktree add ../nextpatch-qa -b feature/test-release-qa
```

## マージ順

1. `feature/project-foundation`
2. `feature/local-runtime`
3. `feature/db-auth-security`
4. `feature/repository-workitem-domain`
5. `feature/dashboard-state-logic`
6. `feature/quick-capture-triage`
7. `feature/export-backup`
8. `feature/ui-dads-responsive`
9. `feature/test-release-qa`

## メインエージェントの担当

- ドキュメントと実装のズレを検出する。
- サブエージェントの出力をレビューする。
- 依存関係の順にマージする。
- コンフリクトを解消する。
- 重要な設計変更が必要な場合、`docs/` に追記してから実装へ反映する。
- 最終的にローカルサーバー起動、主要E2E、JSON export/import の通過を確認する。

## 完了条件

- `docker compose up -d` でローカル起動できる。
- `supabase start` + `pnpm dev` で開発起動できる。
- 未ログインでは本体へアクセスできない。
- Repository / WorkItem / Inbox / Dashboard / Export が動く。
- GitHub API と OpenAI API は実装していない。
- JSON export ができる。
- 主要テストが通る。
- README に開発起動、常用起動、停止、backup、restore、SMTP、外部公開注意が書かれている。
