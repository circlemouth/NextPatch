# Codex統括エージェント向けプロンプト

以下を Codex のメインエージェントにそのまま渡してください。

```text
あなたは NextPatch リポジトリの改修を統括するメインエージェントです。

目的:
NextPatch の UI 構造を「リポジトリ中心」に単純化する。
左メニューを廃止し、トップレベルUIは実質「リポジトリ」のみにする。
設定は右上メニューへ移動する。
Dashboard / Work Items / Inbox / Capture / Ideas / Tech Notes / References はトップレベルUIから消す。

作業の最終ゴール:
- / -> /repositories
- ログイン後の既定遷移先 -> /repositories
- /repositories をホーム画面にする
- /repositories/[repositoryId] を中心作業画面にする
- /settings, /settings/data, /settings/system は右上メニューから到達する
- /dashboard, /work-items, /inbox, /capture/new, /ideas, /tech-notes, /references は原則 /repositories へ redirect する
- 旧ルートは未認証アクセス時の保護対象としては残してよい

重要なUI方針:
- 左メニューを削除する
- topbar 左に NextPatch brand link を置き、href は /repositories
- topbar 右に「メニュー」または「設定メニュー」を置く
- メニュー内に 設定 / データ管理 / システム状態 / ログアウト を置く
- Quick Capture ボタンは topbar から削除する
- 「すぐ書く」はリポジトリ詳細画面に置く
- 主要UIで WorkItem という語を使わず、「メモ・タスク」と表記する
- 目的まで3操作以内を守る
- DB schema 変更は原則不要。既存 work_items を内部モデルとして使う
- DADS参照ルールに従い、重要情報は隠さず、フォームには label と support text を付け、placeholder に説明を依存せず、disabled を安易に使わない
- モバイルでも左メニューやボトムナビゲーションを作らない

参照ドキュメント:
- docs/repo-centric-ui-refactor/implementation-plan.md
- docs/repo-centric-ui-refactor/file-map.md
- docs/repo-centric-ui-refactor/merge-protocol.md
- docs/repo-centric-ui-refactor/risk-and-test-plan.md
- docs/repo-centric-ui-refactor/acceptance-checklist.md
- docs/repo-centric-ui-refactor/reference/dads_app_ui_design_rules_20260411.md

現在の重要対象ファイル:
- src/app/(app)/layout.tsx
- src/app/globals.css
- src/app/page.tsx
- src/app/(auth)/login/page.tsx
- src/proxy.ts
- src/server/auth/actions.ts
- src/server/auth/redirects.ts
- src/server/auth/redirects.test.ts
- src/app/(app)/repositories/page.tsx
- src/app/(app)/repositories/[repositoryId]/page.tsx
- src/app/(app)/dashboard/page.tsx
- src/app/(app)/work-items/page.tsx
- src/app/(app)/inbox/page.tsx
- src/app/(app)/capture/new/page.tsx
- src/app/(app)/ideas/page.tsx
- src/app/(app)/tech-notes/page.tsx
- src/app/(app)/references/page.tsx
- src/app/(app)/work-items/[workItemId]/page.tsx
- src/server/actions/repositories.ts
- src/server/actions/work-items.ts
- src/server/actions/capture.ts
- src/server/db/queries/repositories.ts
- src/server/db/queries/work-items.ts
- src/server/validation/schemas.ts
- src/server/types.ts
- tests/e2e/sqlite-smoke.spec.ts
- README.md
- AGENTS.md

作業手順:
1. git status --short を確認し、未コミット変更があれば内容を報告する。勝手に破棄しない。
2. 統合作業ブランチ feature/repo-centric-ui を作成する。
3. docs/repo-centric-ui-refactor/ が存在することを確認する。存在しなければ、このプロンプトに含まれる内容に従って作成する。
4. 以下のサブエージェントを必ず別々の worktree で起動する。
   - ui-shell-agent
   - repository-pages-agent
   - tests-docs-agent
5. worktree は例として以下を使う。
   - ../nextpatch-ui-shell
   - ../nextpatch-repository-pages
   - ../nextpatch-tests-docs
6. docs/repo-centric-ui-refactor/agent-prompts.md から各サブエージェント用プロンプトを渡す。
7. 各サブエージェントには、必ず個別 worktree で作業するよう指示する。
8. 各サブエージェント完了後、差分を確認する。
9. 次の順番で統合作業ブランチへマージする。
   1. ui-shell-agent
   2. repository-pages-agent
   3. tests-docs-agent
10. コンフリクトが出たら、リポジトリ中心UIを優先して解消する。
11. 旧左メニューや /dashboard 主導線が復活していないか確認する。
12. 最終的に以下を実行する。
   - pnpm lint
   - pnpm typecheck
   - pnpm test
   - pnpm test:e2e
13. テストに失敗した場合は、失敗原因を調べて修正する。未解決で終わる場合は、失敗ログと未解決理由を final-report.md に明記する。
14. docs/repo-centric-ui-refactor/final-report.md を作成する。
15. docs/repo-centric-ui-refactor/test-results.md を作成する。
16. docs/repo-centric-ui-refactor/final-diff-summary.md を作成する。
17. docs/repo-centric-ui-refactor.zip を作成する。

サブエージェントへのプロンプト:
- docs/repo-centric-ui-refactor/agent-prompts.md を使うこと。
- サブエージェントへのプロンプト内容を変更した場合は、変更後の内容を agent-prompts.md に保存すること。

マージ後の重点確認:
- src/app/(app)/layout.tsx に sidebar/navItems が残っていない
- src/app/globals.css で sidebar をモバイル復活させていない
- src/app/page.tsx が /repositories に redirect している
- src/server/auth/redirects.ts の fallback が /repositories
- src/proxy.ts の authenticated login redirect が /repositories
- src/app/(auth)/login/page.tsx の authenticated redirect が /repositories
- /repositories がホームとして機能している
- /repositories/[repositoryId] に「現在の焦点」と「すぐ書く」がある
- WorkItem という語が主要UIに出ていない
- /dashboard 等の旧ページがトップUIから消えている
- 右上メニューから settings/data/system/logout に到達できる

完了条件:
acceptance-checklist.md の全項目を満たすこと。
```
