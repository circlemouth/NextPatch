# 実装タスク分解

## T01 プロジェクト基盤

- 目的: Next.js + TypeScript の空アプリを作る。
- 変更対象: package.json, tsconfig, app/, src/, test config。
- 実装内容: Next.js App Router、lint、format、Vitest、Playwright準備。
- 受け入れ条件: `pnpm build` と `pnpm test` が通る。
- 関連画面: 全画面。
- 関連データ: なし。
- テスト観点: build/type/lint。
- 依存タスク: なし。

## T02 ローカル実行基盤

- 目的: ローカルサーバーで起動できる。
- 変更対象: Dockerfile, docker-compose.yml, .env.example, README。
- 実装内容: Next.js standalone、Supabase接続、healthcheck、volume方針。
- 受け入れ条件: `docker compose up -d` で起動し、画面が見える。
- 関連画面: `/settings/system`。
- 関連データ: system status。
- テスト観点: Docker build、env不足エラー。
- 依存タスク: T01。

## T03 Supabase DB/Auth/RLS

- 目的: Auth, RLS, migration を整える。
- 変更対象: supabase/migrations, server client。
- 実装内容: workspaces, members, repositories, work_items 等を定義。
- 受け入れ条件: migration 適用、RLS有効、ログイン必須。
- 関連画面: login, settings。
- 関連データ: 全主要テーブル。
- テスト観点: RLS, IDOR。
- 依存タスク: T02。

## T04 Repository CRUD

- 目的: repo を登録・管理する。
- 変更対象: repositories pages/actions/parser。
- 実装内容: GitHub URL parser、CRUD、archive。
- 受け入れ条件: URLから owner/repo 保存。
- 関連画面: repo一覧/詳細。
- 関連データ: repositories。
- テスト観点: parser, owner権限。
- 依存タスク: T03。

## T05 WorkItem CRUD

- 目的: 中心データを作成・編集する。
- 変更対象: work-items pages/actions/repositories。
- 実装内容: type別detail、repositoryId nullable。
- 受け入れ条件: task/bug/idea/memo 作成可能。
- 関連画面: WorkItem一覧/詳細。
- 関連データ: work_items, bug_details, ideas。
- テスト観点: nullable, validation。
- 依存タスク: T04。

## T06 状態遷移

- 目的: completedAt/closedAt を正しく扱う。
- 変更対象: domain/status, actions。
- 実装内容: 状態定義、遷移検証、history保存。
- 受け入れ条件: 完了/解除が仕様通り。
- 関連画面: dashboard, item detail。
- 関連データ: status_histories。
- テスト観点: transition matrix。
- 依存タスク: T05。

## T07 ダッシュボード

- 目的: 今やるべきことを出す。
- 変更対象: dashboard query/UI。
- 実装内容: tier計算、理由チップ、セクション表示。
- 受け入れ条件: P0/重大バグ/未整理が正しく表示。
- 関連画面: dashboard。
- 関連データ: work_items, repositories。
- テスト観点: seed expected。
- 依存タスク: T06。

## T08 クイック登録・未整理メモ

- 目的: 3操作以内で保存する。
- 変更対象: capture page, memo parser。
- 実装内容: raw memo保存、JSON/Markdown検出、candidate作成。
- 受け入れ条件: invalid JSON でも原文保存。
- 関連画面: capture, inbox。
- 関連データ: work_items(type=memo), classification_candidates。
- テスト観点: parser, privacyLevel。
- 依存タスク: T05。

## T09 分類適用

- 目的: memo を item 化する。
- 変更対象: inbox actions。
- 実装内容: candidate apply、元メモ保持、履歴。
- 受け入れ条件: 元メモと作成先が関連する。
- 関連画面: inbox。
- 関連データ: classification_candidates, work_items。
- テスト観点: transaction rollback。
- 依存タスク: T08。

## T10 Export/Import

- 目的: ローカル運用のデータ保全。
- 変更対象: settings/data, export services。
- 実装内容: JSON/Markdown/CSV export、JSON validate/restore。
- 受け入れ条件: round-trip テスト通過。
- 関連画面: settings/data。
- 関連データ: export_logs, import_jobs。
- テスト観点: schemaVersion, hash, nullable。
- 依存タスク: T05。

## T11 DADS UI / Responsive

- 目的: 迷わず使えるUI。
- 変更対象: components, layout, css tokens。
- 実装内容: フォーム、ボタン、バナー、カード、テーブル、モバイルメニュー。
- 受け入れ条件: a11y checklist 通過。
- 関連画面: 全画面。
- 関連データ: なし。
- テスト観点: axe, keyboard, viewport。
- 依存タスク: T01以降随時。

## T12 QA / Release

- 目的: リリース可能化。
- 変更対象: tests, README, seed。
- 実装内容: E2E、seed data、local ops docs。
- 受け入れ条件: release checklist 全通過。
- 関連画面: 全画面。
- 関連データ: 全主要テーブル。
- テスト観点: full path。
- 依存タスク: 全タスク。
