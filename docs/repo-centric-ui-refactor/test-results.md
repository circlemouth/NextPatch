# Test Results

## 実行環境

- OS: Windows
- Node: `v22.16.0`
- pnpm: `10.26.2`
- ブランチ: `feature/repo-centric-ui`
- 実行日: 2026-04-22

## コマンド結果

| コマンド | 結果 | 要点 |
|---|---|---|
| `pnpm install` | pass | `node_modules` 不在のため実行 |
| `pnpm lint` | pass | `eslint .` |
| `pnpm typecheck` | pass | `tsc --noEmit` |
| `pnpm test` | pass | 13 files / 85 tests passed |
| `pnpm exec playwright install chromium` | pass | E2E ブラウザ未導入のため実行 |
| `pnpm test:e2e` | pass | Chromium / mobile-chrome の 2 tests passed |

## 修正した検証ブロッカー

- `pnpm lint` 初回は `node_modules` 不在で `eslint` が見つからなかったため、`pnpm install` を実行した。
- `pnpm test:e2e` 初回は Windows で `spawn pnpm ENOENT`、次に `.cmd` 起動の `spawn EINVAL` が出たため、`scripts/e2e/web-server.ts` を Windows では `pnpm.cmd` + `shell: true` で起動するようにした。
- Playwright Chromium が未インストールだったため、`pnpm exec playwright install chromium` を実行した。
- E2E selector は repo-centric UI の日本語ラベルと `details/summary` メニューに合わせて調整した。

## 最終確認

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `pnpm test:e2e`
- [x] 未認証 `/repositories` は `/login?next=%2Frepositories`
- [x] ログイン成功後 `/repositories`
- [x] リポジトリ作成後、詳細画面
- [x] 現在の焦点保存後、同じ詳細画面
- [x] 「すぐ書く」保存後、同じ詳細画面
- [x] 右上メニューから `/settings/data`
- [x] export links は `/settings/data` で確認
