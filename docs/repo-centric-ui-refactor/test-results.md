# Test Results

## 実行環境

- OS: macOS
- Node: `v22.16.0`
- pnpm: `10.26.2`
- ブランチ: `main`
- 実行日: 2026-04-22

## コマンド結果

| コマンド | 結果 | 要点 |
|---|---|---|
| `pnpm install` | not run | 既存の `node_modules` を使用 |
| `pnpm lint` | pass | `eslint .` |
| `pnpm typecheck` | pass | `tsc --noEmit` |
| `pnpm test` | pass | 13 files / 87 tests passed |
| `pnpm exec playwright install chromium` | not run | 既存の Chromium を使用 |
| `pnpm test:e2e` | pass | Chromium / mobile-chrome の 2 tests passed |

## 過去に修正した検証ブロッカー

- `pnpm lint` 初回は `node_modules` 不在で `eslint` が見つからなかったため、`pnpm install` を実行した。
- `pnpm test:e2e` 初回は Windows で `spawn pnpm ENOENT`、次に `.cmd` 起動の `spawn EINVAL` が出たため、`scripts/e2e/web-server.ts` を Windows では `pnpm.cmd` + `shell: true` で起動するようにした。
- Playwright Chromium が未インストールだったため、`pnpm exec playwright install chromium` を実行した。
- E2E selector は repo-centric UI の日本語ラベルと `details/summary` メニューに合わせて調整した。
- 追加コードレビュー対応後、焦点 textarea の既存値表示により同一テキストが 2 箇所に出るため、E2E selector を現在焦点の表示要素へ絞った。
- E2E で「すぐ書く」に空白だけを入力した場合の `＊内容を入力してください。` 表示と `aria-describedby` を確認した。

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
