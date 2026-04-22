# NextPatch リポジトリ中心UI改修 Codex実装パック

このドキュメントセットは、NextPatch の UI を「リポジトリごとのメモ・タスク管理」に単純化するための Codex 実装指示一式です。

## 目的

現状の `Dashboard / Repositories / Work Items / Inbox / Capture / Ideas / Tech Notes / References / Settings` という多い入口を整理し、ユーザーが迷わない構造にします。

最終的な主導線は次の一本です。

```text
アプリを開く
→ リポジトリ一覧
→ リポジトリを開く
→ メモ・タスクを書く
```

設定は作業の主導線ではないため、左メニューではなく右上メニューに移動します。

```text
NextPatch
└─ リポジトリ

右上メニュー
└─ 設定
   ├─ データ管理
   └─ システム状態
```

## zipの使い方

このzipは、リポジトリルートで展開することを想定しています。

```bash
unzip nextpatch-repo-centric-ui-codex-pack.zip -d /path/to/NextPatch
cd /path/to/NextPatch
```

展開後、次のファイルが配置されます。

```text
docs/repo-centric-ui-refactor/
├─ README.md
├─ manifest.md
├─ implementation-plan.md
├─ codex-main-prompt.md
├─ agent-prompts.md
├─ file-map.md
├─ merge-protocol.md
├─ risk-and-test-plan.md
├─ acceptance-checklist.md
└─ reference/
   └─ dads_app_ui_design_rules_20260411.md
```

## Codexへの渡し方

最初に `codex-main-prompt.md` の全文を Codex のメインエージェントに渡してください。

メインエージェントは以下を行います。

1. 統合作業ブランチを作る。
2. サブエージェント用の個別 worktree を作る。
3. `agent-prompts.md` のプロンプトを各サブエージェントに渡す。
4. 差分を順番にマージする。
5. コンフリクトを調整する。
6. `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:e2e` を実行する。
7. 最終結果とテスト結果を `docs/repo-centric-ui-refactor/final-report.md` に保存する。
8. `docs/repo-centric-ui-refactor.zip` を生成する。

## 重要な設計ルール

- 左メニューは廃止する。
- `/repositories` をホームにする。
- `/repositories/[repositoryId]` を作業中心画面にする。
- 設定は右上メニューへ退避する。
- トップレベルUIで `WorkItem`、`Inbox`、`Capture`、`Ideas`、`Tech Notes`、`References` を見せない。
- 内部モデルとして `work_items` は残してよい。
- UI上の用語は `メモ・タスク` を基本にする。
- 目的到達は3操作以内にする。
- DADS参照ルールに従い、重要情報を隠さず、フォームにはラベルと補足説明を付け、ボタンの無効化に依存しない。
- DADS参照ルールではボトムナビゲーションは非推奨なので、スマホでもボトムナビは作らない。

## 主要ファイル

現リポジトリでは以下が主要な変更対象です。

```text
src/app/(app)/layout.tsx
src/app/globals.css
src/app/page.tsx
src/app/(auth)/login/page.tsx
src/proxy.ts
src/server/auth/actions.ts
src/server/auth/redirects.ts
src/server/actions/repositories.ts
src/server/actions/work-items.ts
src/server/actions/capture.ts
src/server/db/queries/repositories.ts
src/server/db/queries/work-items.ts
src/server/validation/schemas.ts
src/app/(app)/repositories/page.tsx
src/app/(app)/repositories/[repositoryId]/page.tsx
tests/e2e/sqlite-smoke.spec.ts
src/server/auth/redirects.test.ts
README.md
AGENTS.md
```

## 完了の判定

`acceptance-checklist.md` の全項目を満たし、以下のコマンドが通れば完了です。

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```
