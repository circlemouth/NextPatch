# NextPatch SQLite 移行ドキュメントセット Manifest

## 目的

このドキュメントセットは、NextPatch を Supabase 前提から SQLite ローカル継続運用へ移行するための実装前計画を、リポジトリ内でそのまま参照できる形にまとめたものです。

## 配置場所

```text
nextpatch-sqlite-migration-docs/
```

## ファイル一覧

| ファイル | 説明 |
|---|---|
| `README.md` | ドキュメントセットの入口 |
| `nextpatch-sqlite-migration-plan.md` | 移行計画本体。方針、工程表、リスク、最終成果物イメージを収録 |
| `agent-prompts.md` | Codex サブエージェント / 統括エージェント用プロンプト集 |
| `checklists.md` | Supabase 削除、SQLite 初期化、export、Docker、UI、zip の検証チェックリスト |
| `codex-orchestrator-quickstart.md` | worktree 作成、merge 順、最終検証、zip 作成の短縮手順 |
| `reference/dads_app_ui_design_rules_20260411.md` | UI 変更時に参照する DADS ベースの UI デザインルール |
| `_deliverables/nextpatch-sqlite-migration-docset.zip` | ドキュメントセットだけを固めた zip |

## 注意

- このドキュメントセットは実装コードを変更しない。
- 後続の実装は Codex 実装エージェントが個別 git worktree で行う。
- Supabase を残す案、Supabase client を温存する案、PostgreSQL コンテナを維持する案は禁止。
- 後方互換性は不要。既存データは 1 件もない前提。
