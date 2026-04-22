# ui-shell-agent Report

## 変更概要

- 左サイドバーと `Quick Capture` を廃止し、`NextPatch` ブランドリンク + 右上メニューのトップバーへ変更しました。
- 既定遷移先を `/repositories` に統一しました。
- `/repositories` をホームとして、repository summary を表示する一覧に変更しました。
- `/repositories/[repositoryId]` をリポジトリ中心の詳細画面に変更し、`現在の焦点` 編集と `すぐ書く` を追加しました。
- `createWorkItem`、`quickCapture`、`updateRepositoryFocus`、認証リダイレクトを新導線に合わせて更新しました。
- 旧ページは `/repositories` へ redirect するだけに変更しました。
- E2E と単体テスト、README、AGENTS を新導線に合わせて更新しました。

## 変更ファイル

- `AGENTS.md`
- `README.md`
- `src/app/(app)/capture/new/page.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/ideas/page.tsx`
- `src/app/(app)/inbox/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(app)/references/page.tsx`
- `src/app/(app)/repositories/[repositoryId]/page.tsx`
- `src/app/(app)/repositories/page.tsx`
- `src/app/(app)/tech-notes/page.tsx`
- `src/app/(app)/work-items/[workItemId]/page.tsx`
- `src/app/(app)/work-items/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/proxy.ts`
- `src/server/actions/capture.ts`
- `src/server/actions/repositories.ts`
- `src/server/actions/work-items.ts`
- `src/server/auth/actions.ts`
- `src/server/auth/redirects.test.ts`
- `src/server/auth/redirects.ts`
- `src/server/db/queries.test.ts`
- `src/server/db/queries/repositories.ts`
- `src/server/types.ts`
- `src/server/validation/schemas.test.ts`
- `src/server/validation/schemas.ts`
- `tests/e2e/sqlite-smoke.spec.ts`

## 実行したテスト

- `pnpm lint` - 成功
- `pnpm typecheck` - 成功
- `pnpm test src/server/auth/redirects.test.ts` - 成功
- `pnpm test src/server/db/queries.test.ts` - 成功
- `pnpm test src/server/validation/schemas.test.ts` - 成功

## 未実行テスト

- `pnpm test:e2e`
- `pnpm test`

## 懸念点

- repository summary の `未完了件数` は memo も open 扱いで数えます。
- E2E は作成済みだが未実行です。トップバーの `details/summary` メニューはブラウザ差分の影響を受ける可能性があります。
- 作業開始時に依存関係が未導入だったため、この worktree で `pnpm install` を実行しました。
