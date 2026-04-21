# NextPatch SQLite 移行ドキュメントセット

このディレクトリは、NextPatch を Supabase / Supabase Auth / Supabase migration 前提の構成から、SQLite ローカル継続運用向け構成へ移行するための実装前計画です。

このドキュメントセットではコード変更を行っていません。後続の Codex 実装エージェントが参照し、個別 git worktree で作業を進めるための計画・工程表・プロンプト・チェックリストを収録しています。

## 収録ファイル

| ファイル | 用途 |
|---|---|
| `nextpatch-sqlite-migration-plan.md` | 移行方針、工程表、リスク、最終成果物イメージを含む主計画書 |
| `agent-prompts.md` | サブエージェントと統括エージェントへそのまま渡せる Codex 用プロンプト集 |
| `checklists.md` | Supabase 削除チェック、SQLite 動作検証、Docker 検証のチェックリスト |
| `codex-orchestrator-quickstart.md` | 統括エージェントが worktree を切って統合するための短縮手順 |
| `reference/dads_app_ui_design_rules_20260411.md` | UI 整理時に参照する DADS ベースの UI デザインルール |
| `_deliverables/nextpatch-sqlite-migration-docset.zip` | このドキュメントセットだけを固めた zip |

## 最重要方針

- Supabase は完全削除する。
- Supabase Cloud / self-hosted / CLI local は採用しない。
- PostgreSQL コンテナは原則不要にする。
- DB は SQLite を採用する。
- 推奨構成は `better-sqlite3` + Drizzle ORM + Drizzle Kit。
- 後方互換性は不要。既存データは 1 件もない前提で進める。
- 認証は初期実装では廃止し、`local-user` と `personal-workspace` を seed して使う。
- UI 変更は `reference/dads_app_ui_design_rules_20260411.md` に従う。
- 主要導線はなるべく 3 操作以内にする。

## 後続実装で最初に読む順番

1. `nextpatch-sqlite-migration-plan.md`
2. `codex-orchestrator-quickstart.md`
3. `agent-prompts.md`
4. `checklists.md`
5. UI 作業時のみ `reference/dads_app_ui_design_rules_20260411.md`
