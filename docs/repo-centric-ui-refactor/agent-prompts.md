# サブエージェント用プロンプト集

このファイルの各プロンプトを、Codexメインエージェントから各サブエージェントに渡す。

すべてのサブエージェントは、必ず個別 worktree で作業する。

---

## 1. ui-shell-agent プロンプト

```text
あなたは ui-shell-agent です。
必ず個別 worktree で作業してください。
想定 worktree: ../nextpatch-ui-shell
想定 branch: feature/repo-centric-ui-shell

目的:
NextPatch の左メニューを廃止し、設定を右上メニューに移動する。
アプリの初期遷移先を /repositories に変更する。

参照:
- docs/repo-centric-ui-refactor/implementation-plan.md
- docs/repo-centric-ui-refactor/file-map.md
- docs/repo-centric-ui-refactor/reference/dads_app_ui_design_rules_20260411.md

主対象ファイル:
- src/app/(app)/layout.tsx
- src/app/globals.css
- src/app/page.tsx
- src/app/(auth)/login/page.tsx
- src/proxy.ts
- src/server/auth/actions.ts
- src/server/auth/redirects.ts
- src/server/auth/redirects.test.ts
- src/app/(app)/dashboard/page.tsx
- src/app/(app)/work-items/page.tsx
- src/app/(app)/inbox/page.tsx
- src/app/(app)/capture/new/page.tsx
- src/app/(app)/ideas/page.tsx
- src/app/(app)/tech-notes/page.tsx
- src/app/(app)/references/page.tsx

実装内容:
1. src/app/(app)/layout.tsx から navItems と sidebar を削除する。
2. topbar 左に NextPatch brand link を置く。href は /repositories。
3. topbar 右に details/summary 等で開けるメニューを置く。
4. メニュー内に以下を置く。
   - 設定 -> /settings
   - データ管理 -> /settings/data
   - システム状態 -> /settings/system
   - ログアウト form
5. Quick Capture ボタンは topbar から削除する。
6. src/app/page.tsx は /repositories redirect にする。
7. src/app/(auth)/login/page.tsx は認証済みの場合 /repositories に redirect する。
8. src/proxy.ts は認証済みで /login に来た場合 /repositories に redirect する。
9. src/server/auth/redirects.ts の sanitizeNextPath fallback を /repositories に変更する。
10. 可能なら DEFAULT_AUTH_REDIRECT_PATH = "/repositories" を redirects.ts から export し、actions/proxy/login page で使う。
11. loginAction の fallback を /repositories に変更する。
12. /dashboard, /work-items, /inbox, /capture/new, /ideas, /tech-notes, /references は /repositories redirect にする。
13. 旧ルートは isProtectedPath には残してよい。
14. CSS から sidebar 依存を外し、topbar / topbar menu のスタイルを追加する。
15. モバイルでも左メニューやボトムナビを作らない。
16. src/server/auth/redirects.test.ts を更新する。

CSS方針:
- .app-frame は1カラムにする。
- .sidebar, .sidebar__brand, .nav-link, .mobile-menu は削除または未使用化する。
- .topbar はページ上部に固定ではなく通常フローでよい。
- .topbar__brand はリンクで、十分な押下領域を持たせる。
- .topbar-menu はキーボード操作可能な構造にする。
- DADS参照に従い、色だけに依存しない、focus-visible を維持する。

注意:
- UI上のトップレベルはリポジトリだけに見えるようにする。
- 設定は右上メニュー内に退避する。
- WorkItem などの用語整理は repository-pages-agent が主担当。ただし layout には Work Items link を残さない。
- Quick Capture をトップバーに残さない。

検証:
- pnpm lint
- pnpm typecheck
- pnpm test src/server/auth/redirects.test.ts が可能なら実行

完了時:
- docs/repo-centric-ui-refactor/ui-shell-agent-report.md を作成し、変更概要、変更ファイル、実行テスト、未実行テスト、懸念点を書く。
```

---

## 2. repository-pages-agent プロンプト

```text
あなたは repository-pages-agent です。
必ず個別 worktree で作業してください。
想定 worktree: ../nextpatch-repository-pages
想定 branch: feature/repo-centric-ui-repository-pages

目的:
NextPatch の中心画面を /repositories と /repositories/[repositoryId] に集約する。
「リポジトリごとにメモやタスクを書く」だけのUIにする。

参照:
- docs/repo-centric-ui-refactor/implementation-plan.md
- docs/repo-centric-ui-refactor/file-map.md
- docs/repo-centric-ui-refactor/reference/dads_app_ui_design_rules_20260411.md

主対象ファイル:
- src/app/(app)/repositories/page.tsx
- src/app/(app)/repositories/[repositoryId]/page.tsx
- src/app/(app)/work-items/[workItemId]/page.tsx
- src/server/actions/repositories.ts
- src/server/actions/work-items.ts
- src/server/actions/capture.ts
- src/server/db/queries/repositories.ts
- src/server/db/queries/work-items.ts
- src/server/validation/schemas.ts
- src/server/types.ts
- src/app/globals.css

実装内容:
1. /repositories をホーム画面として再設計する。
2. リポジトリカードには以下を表示する。
   - リポジトリ名
   - GitHub full name があれば表示
   - 現在の焦点
   - 未完了件数
   - メモ件数
   - 最終更新
3. 件数表示に必要な repository summary query を追加する。
4. DB schema 変更は原則しない。
5. 未完了判定は src/server/domain/status.ts の isOpen を使う。
6. archived_at / deleted_at がある repository と work item は除外する。
7. /repositories/[repositoryId] を中心作業画面として再設計する。
8. 「WorkItem 追加」という表記を廃止し、「すぐ書く」に変更する。
9. すぐ書くフォームはできるだけ簡単にする。
   - 内容 textarea 必須
   - 種類 radio または select: メモ / タスク / バグ
   - タイトル任意
   - 優先度は既定 p2。表示するなら補助的にする
10. タイトル未入力時は本文の先頭行から生成する。
11. 保存後は /repositories/[repositoryId] に戻る。
12. createWorkItem / quickCapture の redirect を repositoryId ありの場合は repository detail に戻す。
13. repository current_focus を詳細画面で編集できる action を追加する。
14. DB query に updateRepositoryFocusCommand を追加する。
15. 主要UIで WorkItem という語を出さず、「メモ・タスク」と表記する。
16. type/status/priority の英語表記は、可能ならUI表示だけ日本語化する。内部値は変更しない。
17. 既存の状態変更ボタンは残してよいが、リポジトリ詳細内で完結させる。
18. /work-items/[workItemId] は当面残してよい。リポジトリに紐づく場合は、リポジトリ詳細へ戻るリンクを追加できるなら追加する。

推奨 query 形:
- listRepositorySummaries(workspaceId): Promise<RepositorySummaryRow[]>
- RepositorySummaryRow は RepositoryRow に open_item_count, memo_count, last_activity_at を足す
- 集計は SQL でも TypeScript でもよい。ローカルMVPなので TypeScript 集計でも可

推奨 action 形:
- updateRepositoryFocus(formData)
- createWorkItem(formData) は title fallback 後に保存
- createWorkItem 保存後:
  - repositoryId あり -> redirect(`/repositories/${repositoryId}`)
  - repositoryId なし -> redirect(`/repositories`)
- quickCapture 保存後:
  - repositoryId あり -> redirect(`/repositories/${repositoryId}`)
  - repositoryId なし -> redirect(`/repositories`)

注意:
- 「分類」「Inbox」「Capture」という概念を主導線に出さない。
- 利用者が考える順序は「このリポジトリに何を書くか」である。
- フォームには必ず label を付ける。
- placeholder に説明を依存させない。
- disabled ボタンを安易に使わない。
- 重要情報を折りたたみに隠さない。
- DADS参照に従い、単一選択で3択程度なら radio もよい。select でもよいが、選びやすさを優先する。

検証:
- pnpm lint
- pnpm typecheck
- pnpm test の関連範囲

完了時:
- docs/repo-centric-ui-refactor/repository-pages-agent-report.md を作成し、変更概要、変更ファイル、実行テスト、未実行テスト、懸念点を書く。
```

---

## 3. tests-docs-agent プロンプト

```text
あなたは tests-docs-agent です。
必ず個別 worktree で作業してください。
想定 worktree: ../nextpatch-tests-docs
想定 branch: feature/repo-centric-ui-tests-docs

目的:
リポジトリ中心UIへの変更に合わせて、E2E、単体テスト、README、AGENTS、作業ドキュメントを更新する。

参照:
- docs/repo-centric-ui-refactor/implementation-plan.md
- docs/repo-centric-ui-refactor/file-map.md
- docs/repo-centric-ui-refactor/risk-and-test-plan.md
- docs/repo-centric-ui-refactor/acceptance-checklist.md
- docs/repo-centric-ui-refactor/reference/dads_app_ui_design_rules_20260411.md

主対象ファイル:
- tests/e2e/sqlite-smoke.spec.ts
- src/server/auth/redirects.test.ts
- src/server/db/queries.test.ts
- src/server/validation/schemas.test.ts
- README.md
- AGENTS.md
- docs/repo-centric-ui-refactor/final-report.md
- docs/repo-centric-ui-refactor/test-results.md
- docs/repo-centric-ui-refactor/final-diff-summary.md

実装内容:
1. E2E の起点を /dashboard から /repositories に変更する。
2. 未認証アクセスの期待値を /login?next=%2Frepositories に変更する。
3. ログイン成功後の期待URLを /repositories に変更する。
4. リポジトリ作成後、詳細画面に遷移することを確認する。
5. リポジトリ詳細で「現在の焦点」を編集できることを確認する。
6. リポジトリ詳細で「すぐ書く」からメモ・タスクを作成できることを確認する。
7. 保存後、同じリポジトリ詳細に戻ることを確認する。
8. 右上メニューから設定、データ管理、システム状態へ移動できることを確認する。
9. export links のテストは /settings/data で維持する。
10. ログアウト後、/repositories が /login?next=%2Frepositories になることを確認する。
11. redirects.test.ts の fallback 期待値を /repositories に変更する。
12. 必要なら repository summary query の unit test を追加する。
13. 必要なら title 未入力 quick write の validation/action test を追加する。
14. README の /dashboard 記述を /repositories に更新する。
15. AGENTS.md の /dashboard 前提や古い認証説明を現状に合わせて更新する。
16. Dashboard / Work Items / Inbox / Capture などが主導線でないことを README に反映する。
17. docs/repo-centric-ui-refactor/final-report.md の雛形を作成する。
18. docs/repo-centric-ui-refactor/test-results.md の雛形を作成する。
19. docs/repo-centric-ui-refactor/final-diff-summary.md の雛形を作成する。

E2E注意:
- 旧 /work-items /inbox /capture/new を主導線として使わない。
- selector はユーザーから見える日本語ラベルを優先する。
- 右上メニューが details/summary の場合は summary text をクリックしてから link を押す。
- export API の未認証 401 と認証後 200 は維持する。

README注意:
- NextPatch を「リポジトリごとのメモ・タスク管理」と説明する。
- 設定は右上メニューから開くと説明する。
- WorkItem は内部モデルとして残る場合があるが、主要UI名としては使わない。

検証:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm test:e2e

完了時:
- docs/repo-centric-ui-refactor/tests-docs-agent-report.md を作成し、変更概要、変更ファイル、実行テスト、未実行テスト、懸念点を書く。
```
