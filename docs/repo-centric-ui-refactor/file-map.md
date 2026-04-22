# 変更対象ファイルマップ

このファイルは、Codexが対象箇所を素早く把握するためのメモです。

## UIシェル

### `src/app/(app)/layout.tsx`

現状:

- `navItems` に `Dashboard / Repositories / Work Items / Inbox / Capture / Ideas / Tech Notes / References / Settings` が並ぶ。
- `<aside className="sidebar">` が左メニュー。
- topbar に `Quick Capture` と `ログアウト` がある。

変更:

- `navItems` と sidebar を削除。
- `NextPatch` ブランドリンクを `/repositories` に向ける。
- 右上メニューに `設定 / データ管理 / システム状態 / ログアウト` を置く。
- `Quick Capture` は削除。

## CSS

### `src/app/globals.css`

現状:

- `.app-frame` が `grid-template-columns: var(--layout-sidebar) minmax(0, 1fr);`
- `.sidebar`、`.sidebar__brand`、`.nav-link` が定義されている。
- モバイルで `.sidebar` を上部に出す記述がある。

変更:

- `.app-frame` は1カラム。
- `.sidebar` 系は削除または未使用化。
- `.topbar__brand`、`.topbar__right`、`.topbar-menu`、`.topbar-menu__panel` を追加。
- モバイルでも左メニューを表示しない。

## 既定リダイレクト

### `src/app/page.tsx`

現状:

- `/dashboard` に redirect。

変更:

- `/repositories` に redirect。

### `src/app/(auth)/login/page.tsx`

現状:

- 認証済みなら `/dashboard` に redirect。

変更:

- 認証済みなら `/repositories` に redirect。

### `src/proxy.ts`

現状:

- 認証済みで `/login` に来ると `/dashboard` に redirect。

変更:

- `/repositories` に redirect。

### `src/server/auth/actions.ts`

現状:

- `redirect(nextPath || "/dashboard")`。

変更:

- `redirect(nextPath || DEFAULT_AUTH_REDIRECT_PATH)`。

### `src/server/auth/redirects.ts`

現状:

- `sanitizeNextPath` fallback が `/dashboard`。
- `/dashboard` は protected path。

変更:

- fallback を `/repositories`。
- 可能なら `DEFAULT_AUTH_REDIRECT_PATH` を export。
- `/dashboard` は protected path に残してよい。

### `src/server/auth/redirects.test.ts`

変更:

- fallback 期待値を `/repositories`。
- safe path として `/dashboard?tab=summary` は維持してもよいが、fallback ではないことを明確にする。

## リポジトリ一覧

### `src/app/(app)/repositories/page.tsx`

現状:

- 見出しは `Repositories` / `リポジトリ`。
- 左側に一覧、右側に追加フォーム。
- カードには `production_status`、`criticality`、`github_full_name`、`current_focus` が表示される。

変更:

- `/repositories` をホームとして扱う説明文に変更。
- `current_focus` を強く見せる。
- 未完了件数、メモ件数、最終更新を追加。
- 追加フォームの主項目を `リポジトリ名 / GitHub URL / 現在の焦点` に寄せる。
- `production_status` と `criticality` は補助項目。

## リポジトリ詳細

### `src/app/(app)/repositories/[repositoryId]/page.tsx`

現状:

- 左に「次アクションと項目」。
- 右に「WorkItem 追加」。
- 種類、タイトル、本文のフォーム。

変更:

- ページ上部に `現在の焦点` 編集フォーム。
- 右または上部に `すぐ書く` フォーム。
- `WorkItem` 表記を主要UIから削除。
- 作成後は同じ `/repositories/[repositoryId]` に戻る。
- 一覧見出しは `メモ・タスク`。

## Server actions

### `src/server/actions/repositories.ts`

追加:

- `updateRepositoryFocus(formData)`。

処理:

- `id` と `currentFocus` を取得。
- `updateRepositoryFocusCommand` を呼ぶ。
- `/repositories` と `/repositories/[id]` を revalidate。
- `/repositories/[id]` に redirect。

### `src/server/actions/work-items.ts`

現状:

- title 必須。
- 保存後 `/work-items/[id]` に redirect。

変更:

- title 未入力時は body の先頭行から生成。
- repositoryId ありなら `/repositories/[repositoryId]` に redirect。
- repositoryId なしなら `/repositories` に redirect。
- revalidate は `/repositories`、repository detail、必要に応じて `/work-items`。

### `src/server/actions/capture.ts`

現状:

- 保存後 memo は `/inbox`、それ以外は `/work-items`。

変更:

- repositoryId ありなら `/repositories/[repositoryId]`。
- repositoryId なしなら `/repositories`。
- 互換ルートとして残す場合でもトップUIからは使わない。

## DB queries

### `src/server/db/queries/repositories.ts`

追加候補:

- `updateRepositoryFocusCommand(workspaceId, id, currentFocus)`。
- `listRepositorySummaries(workspaceId)`。

注意:

- workspace scope を必ず確認。
- archived/deleted repository を除外。

### `src/server/db/queries/work-items.ts`

追加候補:

- repository summary 集計用に全 active work item を取得する helper。
- ただし既存 `listWorkItemsForRepository` を使ってページ側で集計してもよい。

## Validation

### `src/server/validation/schemas.ts`

変更候補:

- `workItemSchema.title` を optional にする。
- `body` は repository detail の quick write では必須にする。既存フォーム影響を避けるなら専用 schema を作る。

おすすめ:

```ts
export const quickWorkItemSchema = z.object({
  repositoryId: z.string().uuid(),
  type: z.enum(["task", "bug", "memo"]).default("memo"),
  title: z.string().trim().optional(),
  body: z.string().trim().min(1, "＊内容を入力してください。"),
  priority: z.enum(["p0", "p1", "p2", "p3", "p4"]).default("p2")
});
```

ただし、既存 action と重複しすぎるなら `workItemSchema` を調整してよい。

## 旧ページ

以下は redirect に変更する。

```text
src/app/(app)/dashboard/page.tsx
src/app/(app)/work-items/page.tsx
src/app/(app)/inbox/page.tsx
src/app/(app)/capture/new/page.tsx
src/app/(app)/ideas/page.tsx
src/app/(app)/tech-notes/page.tsx
src/app/(app)/references/page.tsx
```

## E2E

### `tests/e2e/sqlite-smoke.spec.ts`

現状:

- `/dashboard` 起点。
- `Quick Capture`、`/work-items`、`/inbox` を主導線にしている。

変更:

- `/repositories` 起点。
- リポジトリ詳細で「すぐ書く」を使う。
- 右上メニューで設定に移動。

## Docs

### `README.md`

変更:

- ログイン後 `/dashboard` ではなく `/repositories`。
- 左メニュー説明があれば削除。
- NextPatch は `リポジトリごとのメモ・タスク管理` と説明。

### `AGENTS.md`

変更:

- `/login` の説明で `/dashboard` を `/repositories` に変更。
- MVP説明で「認証未実装」など古い記述があれば現状に合わせて調整。
