# AGENTS.md

## Repo Overview

- NextPatch は、リポジトリ作業、バグ、アイデア、実装メモ、ChatGPT の貼り付けメモ、次に取るべきアクションを整理するための、自己管理型のローカルサーバー Web アプリです。
- MVP はローカルの単一ユーザー向けです。認証は未実装で、既定では localhost 前提です。LAN や公開インターネットに露出させる前提ではありません。
- GitHub 連携は URL 解析が中心で、ChatGPT 連携は手動貼り付けとローカルの JSON / Markdown 解析が中心です。
- 画面側は `src/app/`、サーバー側は `src/server/`、運用スクリプトは `scripts/`、設計メモや実装計画は `docs/` にあります。

## Common Entry Points

- 開発起動: `pnpm install` -> `cp .env.example .env.local` -> `pnpm db:migrate` -> `pnpm db:seed` -> `pnpm dev`
- ローカル常駐起動: `cp .env.example .env` -> `docker compose up -d`
- 停止: `docker compose down`
- よく使う確認: `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:e2e`

## Implementation Notes

- SQLite 移行の正本は `drizzle/*.sql` の手書き SQL です。`db:generate` は使わないこと。
- `src/server/db/schema.ts` は Drizzle の型付け用で、制約の正本ではありません。
- `data/`、`exports/`、`backups/` は Git 管理から外す前提です。DB バックアップは JSON エクスポートか SQLite 安全な方法を優先します。
- `/login` はログイン機能ではなく、`/repositories` への安全なリダイレクト用です。
- 外部公開を前提にした変更をする場合は、先に HTTPS と明示的なアクセス制御を追加してください。

## Workspace Cleanup Rule

- 作業に使ったワークツリーを `main` に取り込んだら、そのワークツリーは速やかに削除すること。
- そのワークツリーに紐づく生成物・一時ファイル・作業用に置いた関連ファイルも、必要なものを本体に反映したうえで削除すること。
- 取り込み後に同じ内容の作業ツリーや重複ファイルを残さないこと。
