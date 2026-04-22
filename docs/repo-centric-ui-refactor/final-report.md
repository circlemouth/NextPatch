# Final Report

## 1. 概要

- 統合ブランチ: `feature/repo-centric-ui`
- 完了日: 2026-04-22
- 統合済みサブエージェント:
  - `ui-shell-agent`: 完了
  - `repository-pages-agent`: 完了
  - `tests-docs-agent`: 完了

## 2. 実装したこと

- 左メニューを廃止し、トップバー左の `NextPatch` brand link を `/repositories` に向けた。
- トップバー右に `設定メニュー` を追加し、`設定` / `データ管理` / `システム状態` / `ログアウト` を集約した。
- `/`、ログイン後 fallback、認証済み `/login` の遷移先を `/repositories` に統一した。
- `/dashboard`、`/work-items`、`/inbox`、`/capture/new`、`/ideas`、`/tech-notes`、`/references` を `/repositories` redirect にした。
- `/repositories` をホーム画面として再構成し、リポジトリ別の未完了件数、メモ件数、最終更新、現在の焦点を表示するようにした。
- `/repositories/[repositoryId]` を中心作業画面として再構成し、現在の焦点編集と「すぐ書く」からのメモ・タスク作成を詳細画面内で完結させた。
- Work item の内部モデルは維持しつつ、主要 UI の表記を「メモ・タスク」に寄せた。
- E2E の web server 起動を Windows でも動くように修正した。
- README、AGENTS、テスト、レポートを repo-centric UI に合わせて更新した。

## 3. 変更ファイルの要点

- UI shell: `src/app/(app)/layout.tsx`, `src/app/globals.css`
- Routing/auth: `src/app/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/proxy.ts`, `src/server/auth/*`
- Repository UI: `src/app/(app)/repositories/page.tsx`, `src/app/(app)/repositories/[repositoryId]/page.tsx`
- Legacy redirects: `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/work-items/page.tsx`, `src/app/(app)/inbox/page.tsx`, `src/app/(app)/capture/new/page.tsx`, `src/app/(app)/ideas/page.tsx`, `src/app/(app)/tech-notes/page.tsx`, `src/app/(app)/references/page.tsx`
- Server actions/queries: `src/server/actions/*`, `src/server/db/queries/repositories.ts`, `src/server/validation/schemas.ts`, `src/server/types.ts`
- Tests/docs: `tests/e2e/sqlite-smoke.spec.ts`, `src/server/**/*.test.ts`, `README.md`, `AGENTS.md`

## 4. 検証結果

詳細は `test-results.md` を参照。

| コマンド | 結果 |
|---|---|
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm test` | pass |
| `pnpm test:e2e` | pass |

## 5. 受け入れ条件

- 左メニュー、`navItems`、`Quick Capture` topbar 導線は削除済み。
- `/repositories` がホームとして機能する。
- `/repositories/[repositoryId]` に「現在の焦点」と「すぐ書く」がある。
- 旧トップレベル画面は `/repositories` に redirect される。
- 右上メニューから settings/data/system/logout に到達できる。
- 主要 UI で `WorkItem` 表記は使っていない。
- モバイル用の左メニューやボトムナビゲーションは追加していない。

## 6. 未解決事項

- なし。
