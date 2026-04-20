# NextPatch ローカルサーバー版 ドキュメントセット

このリポジトリは、NextPatch の開発着手前検討を **ローカルサーバー実行版** として統合したドキュメントセットです。

NextPatch は、開発中アプリや GitHub リポジトリごとに、課題、進捗、バグ、実装予定、将来構想、採用技術、参考サービス、新規アイデア、ChatGPT との壁打ちメモを整理し、「今やるべきこと」をすぐ把握するための開発管理アプリです。

## 最終方針

MVP はクラウド SaaS ではなく、まず **個人または小規模利用者が自分のPC・LAN内サーバー・自宅サーバーで動かせる自己管理型 Web アプリ** として作ります。

- 実行形態: ローカルサーバー / LAN 内サーバー / 自宅サーバー
- 推奨スタック: Next.js App Router + TypeScript + Supabase Local/Self-hosted + PostgreSQL + Docker Compose
- 認証: ローカルでも必須。Supabase Auth を利用する
- GitHub 連携: MVP は URL 解析まで。API 同期は後回し
- ChatGPT 連携: MVP は手動貼り付け + 未整理メモ + JSON/Markdown 取り込みまで
- UI 方針: DADS 参照ルール優先。重要情報を隠さず、目的まで3操作以内を守る

## 展開方法

空のリポジトリにこの ZIP の中身をそのまま展開してください。

```bash
unzip nextpatch-local-server-docs.zip -d <your-empty-repo>
cd <your-empty-repo>
```

このセットは実装コードではなく、開発開始前の仕様・設計・計画・Codex向け実装プロンプトです。

## 読む順番

1. `docs/00_INDEX.md`
2. `docs/01_MASTER_PLAN_LOCAL_SERVER.md`
3. `docs/13_TECH_ARCHITECTURE_LOCAL_SERVER.md`
4. `docs/19_IMPLEMENTATION_PLAN.md`
5. `prompts/00_CODEX_MAIN_ORCHESTRATOR_PROMPT.md`

## ディレクトリ構成

```text
.
├── README.md
├── docs/
│   ├── 00_INDEX.md
│   ├── 01_MASTER_PLAN_LOCAL_SERVER.md
│   ├── 02_FINAL_DECISIONS.md
│   ├── 03_MVP_SCOPE.md
│   ├── 04_INFORMATION_ARCHITECTURE.md
│   ├── 05_SCREEN_BLUEPRINTS.md
│   ├── 06_UI_STYLE_GUIDE_DADS.md
│   ├── 07_DATA_MODEL.md
│   ├── 08_STATE_AND_DASHBOARD.md
│   ├── 09_API_FEATURE_DESIGN.md
│   ├── 10_AUTH_SECURITY_PRIVACY.md
│   ├── 11_GITHUB_CHATGPT_ROADMAP.md
│   ├── 12_BACKUP_EXPORT_OPERATIONS.md
│   ├── 13_TECH_ARCHITECTURE_LOCAL_SERVER.md
│   ├── 14_TEST_PLAN.md
│   ├── 19_IMPLEMENTATION_PLAN.md
│   ├── 20_TASK_BREAKDOWN.md
│   ├── 21_RISKS_AND_OPEN_DECISIONS.md
│   └── 99_SOURCE_NOTES.md
├── prompts/
│   ├── 00_CODEX_MAIN_ORCHESTRATOR_PROMPT.md
│   └── subagents/
├── references/
│   ├── dads_app_ui_design_rules_20260411.md
│   ├── research/
│   └── web/
└── templates/
```

## 重要な前提

- DADS で詳細ガイドライン未整備の UI コンポーネントは、NextPatch 独自仕様として断定せず、`NextPatch暫定ルール` として扱います。
- スマホはクイック登録・今やること確認・状態更新を主目的にします。
- PC は整理・判断・横断比較・設計確認を主目的にします。
- 重要情報は折りたたみの中に隠しません。
- GitHub と ChatGPT は MVP の中心ではなく、手動入力・URL・貼り付けで価値を検証します。
