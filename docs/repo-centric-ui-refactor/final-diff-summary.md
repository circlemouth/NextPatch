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

## Acceptance Notes

- `src/app/(app)/layout.tsx` に `sidebar` / `navItems` はない。
- `src/app/globals.css` に sidebar/mobile-menu/bottom-nav の復活はない。
- `src/app/page.tsx` は `/repositories` redirect。
- `src/server/auth/redirects.ts` の fallback は `/repositories`。
- `/repositories/[repositoryId]` は「現在の焦点」と「すぐ書く」を持つ。
- 主要 UI は「メモ・タスク」表記に寄せ、`WorkItem` 表記は残していない。
- 右上メニューから settings/data/system/logout に到達できる。

## Test Summary

- `pnpm lint`: pass
- `pnpm typecheck`: pass
- `pnpm test`: pass
- `pnpm test:e2e`: pass
