# Manifest

## パッケージ名

`nextpatch-repo-centric-ui-codex-pack`

## 対象

NextPatch の UI 構造をリポジトリ中心へ単純化する実装作業。

## 作成日

2026-04-22

## 入力前提

- NextPatch は Next.js App Router 構成。
- 現在の主導線は `/dashboard` と左メニュー中心。
- 現在の `work_items` テーブルは内部モデルとして維持する。
- DB schema 変更は原則不要。
- DADS参照にもとづく UI ルールを参照する。

## 同梱ファイル

| ファイル | 役割 |
|---|---|
| `README.md` | このドキュメントセットの使い方 |
| `implementation-plan.md` | 実装計画 |
| `codex-main-prompt.md` | Codex統括エージェントに渡すプロンプト |
| `agent-prompts.md` | サブエージェントに渡すプロンプト集 |
| `file-map.md` | 変更対象ファイルと注意点 |
| `merge-protocol.md` | worktree運用、マージ順、コンフリクト方針 |
| `risk-and-test-plan.md` | リスクとテスト計画 |
| `acceptance-checklist.md` | 受け入れ条件 |
| `reference/dads_app_ui_design_rules_20260411.md` | UIルール参照文書 |

## 想定成果物

Codex 実装後、リポジトリには少なくとも次が追加または更新される。

```text
docs/repo-centric-ui-refactor/final-report.md
docs/repo-centric-ui-refactor/test-results.md
docs/repo-centric-ui-refactor/repo-centric-ui-refactor.patch または final-diff-summary.md
docs/repo-centric-ui-refactor.zip
```

## 完了時の状態

- `/` とログイン後の既定遷移先が `/repositories`。
- 左メニューが存在しない。
- 右上メニューから設定系ページに到達できる。
- リポジトリ一覧がホーム。
- リポジトリ詳細で現在の焦点編集とメモ・タスク作成ができる。
- 旧ページはトップUIから消え、互換目的で `/repositories` へリダイレクトされる。
