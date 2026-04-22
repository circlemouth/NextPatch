# Final Diff Summary

## Summary

NextPatch のトップレベル UI を repository-centric に統合した。左メニューを削除し、`/repositories` をホーム、`/repositories/[repositoryId]` を中心作業画面にした。設定系は右上メニューへ移動し、旧トップレベル画面は `/repositories` redirect にした。

## Major Changes

| Area | Change |
|---|---|
| App shell | Sidebar/nav items を削除し、topbar brand link + settings menu に変更 |
| Routing | `/`、ログイン fallback、認証済み `/login` を `/repositories` に統一 |
| Legacy pages | Dashboard / Work Items / Inbox / Capture / Ideas / Tech Notes / References を `/repositories` redirect に変更 |
| Repository home | リポジトリ一覧に GitHub full name、現在の焦点、未完了件数、メモ件数、最終更新を表示 |
| Repository detail | 「現在の焦点」と「すぐ書く」を追加し、保存後も詳細画面に戻る |
| Server actions | repositoryId ありの作成/quick capture は repository detail に戻す |
| Queries | `listRepositorySummaries` と `updateRepositoryFocusCommand` を追加 |
| Tests | auth redirect、repository summary、validation、E2E を repo-centric UI に更新 |
| E2E server | Windows で Playwright webServer が `pnpm` を起動できるよう修正 |
| Docs | README / AGENTS / refactor reports を更新 |

## Secondary Review Fixes

| Area | Change |
|---|---|
| Repository detail | 現在の焦点 textarea に既存値を `defaultValue` で入れ、placeholder を削除 |
| Quick write | `quick-write-form.tsx` を client component として追加し、`useActionState` で空白-only 本文エラーを画面内表示 |
| Server actions | `createWorkItem` を既存 action として残し、`createWorkItemWithState` を追加して validation error を state として返す |
| Work item detail | 本文を `work-item-body` で表示し、改行と長い文字列の折り返しを保持 |
| Tests | privacy level validation の意図を明確化し、E2E で quick write の空白-only エラー表示を確認 |
| Docs archive | final report / test results / diff summary を更新し、`docs/repo-centric-ui-refactor.zip` を再作成 |

## Acceptance Notes

- `src/app/(app)/layout.tsx` に `sidebar` / `navItems` はない。
- `src/app/globals.css` に sidebar/mobile-menu/bottom-nav の復活はない。
- `src/app/page.tsx` は `/repositories` redirect。
- `src/server/auth/redirects.ts` の fallback は `/repositories`。
- `/repositories/[repositoryId]` は「現在の焦点」と「すぐ書く」を持つ。
- 現在の焦点 textarea は保存前の既存値を保持する。
- 「すぐ書く」は空白-only 本文で `＊内容を入力してください。` を画面内に表示する。
- Work item 詳細本文は改行を保持する。
- 主要 UI は「メモ・タスク」表記に寄せ、`WorkItem` 表記は残していない。
- 右上メニューから settings/data/system/logout に到達できる。

## Test Summary

- `pnpm lint`: pass
- `pnpm typecheck`: pass
- `pnpm test`: pass
- `pnpm test:e2e`: pass
