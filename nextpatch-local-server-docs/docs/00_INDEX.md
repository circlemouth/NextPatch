# NextPatch ローカルサーバー版 ドキュメント索引

## 最重要ドキュメント

| ファイル | 目的 |
|---|---|
| `01_MASTER_PLAN_LOCAL_SERVER.md` | 最終成果物 1〜23 を統合した主設計書 |
| `02_FINAL_DECISIONS.md` | 最終決定事項一覧 |
| `03_MVP_SCOPE.md` | MVP スコープと非スコープ |
| `13_TECH_ARCHITECTURE_LOCAL_SERVER.md` | ローカルサーバー版の技術構成 |
| `19_IMPLEMENTATION_PLAN.md` | 実装フェーズ別作業計画 |
| `20_TASK_BREAKDOWN.md` | 実装者へ渡せる粒度のタスク分解 |
| `prompts/00_CODEX_MAIN_ORCHESTRATOR_PROMPT.md` | Codex 統括エージェント用プロンプト |

## 設計領域別ドキュメント

| 領域 | ファイル |
|---|---|
| 情報設計・画面 | `04_INFORMATION_ARCHITECTURE.md`, `05_SCREEN_BLUEPRINTS.md` |
| UI / DADS | `06_UI_STYLE_GUIDE_DADS.md` |
| データモデル | `07_DATA_MODEL.md` |
| 状態・ダッシュボード | `08_STATE_AND_DASHBOARD.md` |
| API・機能 | `09_API_FEATURE_DESIGN.md` |
| 認証・セキュリティ | `10_AUTH_SECURITY_PRIVACY.md` |
| GitHub / ChatGPT | `11_GITHUB_CHATGPT_ROADMAP.md` |
| バックアップ・運用 | `12_BACKUP_EXPORT_OPERATIONS.md` |
| テスト | `14_TEST_PLAN.md` |
| リスク・未決定事項 | `21_RISKS_AND_OPEN_DECISIONS.md` |

## 実装プロンプト

`prompts/subagents/` に、個別 worktree で作業することを前提にしたサブエージェント向けプロンプトを配置しています。

| ファイル | 担当 |
|---|---|
| `01_project_foundation_local_runtime.md` | プロジェクト基盤・ローカル実行 |
| `02_database_auth_security.md` | DB/Auth/RLS/セキュリティ |
| `03_repository_workitem_domain.md` | Repository / WorkItem ドメイン |
| `04_dashboard_state_logic.md` | 状態遷移・ダッシュボード |
| `05_quick_capture_triage.md` | クイック登録・未整理メモ分類 |
| `06_export_backup_operations.md` | エクスポート・復元・運用 |
| `07_ui_dads_responsive.md` | DADS UI・レスポンシブ |
| `08_test_release_qa.md` | QA・E2E・リリース前調整 |

## 参照資料

- `references/dads_app_ui_design_rules_20260411.md`
- `references/research/` に担当別検討結果の原文を格納
- `references/web/official_docs_checked_20260420.md` に公式ドキュメント確認メモを格納
