# NextPatch

NextPatch は、リポジトリ作業、バグ、アイデア、実装メモ、ChatGPT の貼り付けメモ、次に取るべきアクションを整理するための、自己管理型のローカルサーバー Web アプリです。

MVP はローカル単一ユーザー向け実装です。信頼できる LAN 内で利用するための共通パスワードログインと署名付き HttpOnly Cookie セッションを備えていますが、インターネット公開、SSO、多人数管理、パスワードリセット、HTTPS 終端は対象外です。GitHub 連携は URL 解析に限定され、ChatGPT 連携は手動貼り付けとローカルの JSON / Markdown 解析に限定されます。

## Requirements

- Node.js 22
- pnpm 10
- Docker Desktop または Docker Engine

## Development Startup

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`.env.local` に `NEXTPATCH_LOGIN_PASSWORD` と `NEXTPATCH_SESSION_SECRET` を設定してから `http://localhost:3000/login` を開いてください。
セッションシークレットは次のコマンドで生成できます。

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

LAN から開発サーバーにアクセスする確認が必要な場合は、`pnpm dev:lan` を使い、別端末から `http://<ホスト端末のLAN IP>:3000/login` を開きます。
ローカル DB を初期化したい場合は、先に `pnpm db:reset:dev` を実行してください。SQLite ファイル本体と `-wal` / `-shm` の付随ファイルだけを削除し、`NEXTPATCH_DB_PATH` が設定されていればそれを尊重します。

## Daily Local Server Startup

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
docker compose up -d --build
```

`.env` で `NEXTPATCH_LOGIN_PASSWORD` を利用者が決めた共通パスワードに設定し、生成した値を `NEXTPATCH_SESSION_SECRET` に設定してください。実パスワードや実シークレットは `.env.example` や Git 管理ファイルに書かないでください。

この compose ファイルは NextPatch の Web コンテナを起動し、コンテナ起動時に DB 初期化を実行し、SQLite データボリュームを `/app/data` にマウントします。既定では `0.0.0.0:3000` にバインドし、信頼できる LAN 内の別端末から `http://<ホスト端末のLAN IP>:3000/login` でログイン画面を開けます。

ホスト OS のファイアウォールで `3000/tcp` の受信許可が必要な場合があります。ポートや bind address を変える場合は、`.env` の `NEXTPATCH_BIND_HOST` と `NEXTPATCH_HOST_PORT` を変更してください。

HTTPS が必要な場合は、別途リバースプロキシで HTTPS を終端し、`NEXTPATCH_COOKIE_SECURE=true` を設定してください。

## Stop

```bash
docker compose down
```

日常利用のローカルサーバースタックを停止するには `docker compose down` を使います。

## Schema and Migrations

SQLite 移行の正本は `drizzle/*.sql` 以下の手書き SQL です。
それらのファイルがテーブル、制約、インデックスの正しい定義を持ち、migration runner は適用済みステップを `nextpatch_migrations` 履歴に記録する役割を持ちます。

`src/server/db/schema.ts` は Drizzle のクエリ型付けに使われ、SQL と整合している必要がありますが、FK や CHECK 制約の正本ではありません。

SQLite の migration では `db:generate` を使わないでください。このプロジェクトは `drizzle-kit` を dev dependency として保持していません。新しいスキーマ変更は SQL migration を直接書き、runner 経由で migration history に追加してください。

## Backup

Settings > Data から JSON エクスポートを作成してください。その JSON エクスポートを正規のバックアップ成果物として保持します。
Markdown と CSV のエクスポートは閲覧と監査用途に限ります。

DB ボリュームについては、`data/`、`exports/`、`backups/` を Git 管理から外してください。SQLite の WAL / SHM 付随ファイルは、アプリ実行中は DB ファイルと一緒に置いておく必要があります。

DB ファイルのバックアップが実装されたら、稼働中の DB ファイルを単純コピーするのではなく、JSON エクスポートや制御された SQLite backup 操作のような SQLite 安全な方法を優先してください。

バックアップを GitHub に自動コミットしないでください。機密性のあるリポジトリメモを含む可能性があります。

## Restore

Restore は MVP では未実装です。JSON バックアップを、将来の手動移行や後続の restore 作業に使う保存済みバックアップソースとして扱ってください。
MVP は既存ワークスペースへのマージも、Markdown や CSV からの restore も行いません。

## Docker Build Note

SQLite 実装では native addon を持つ `better-sqlite3` を使う想定です。
Alpine ベースの Docker イメージでこの依存関係を追加する場合、deps ステージに Python、make、C++ コンパイラなど `node-gyp` に必要な native build toolchain を含めるか、Debian ベースの Node イメージへ切り替えてください。

## Fresh Start

きれいにローカルを再起動するには、アプリを停止し、`pnpm db:reset:dev` で SQLite DB を削除してから、migration と seed を再実行してください。Docker では、永続状態を完全に破棄したい場合に `docker compose down -v` でデータボリュームも削除できます。

## Login

`/login` は LAN 内利用向けの共通パスワードログイン画面です。ログインに成功すると署名付き HttpOnly Cookie セッションを発行し、指定された安全な内部パス、または `/repositories` に遷移します。ログアウトはアプリ上部のメニューから行います。

`NEXTPATCH_LOGIN_PASSWORD` または `NEXTPATCH_SESSION_SECRET` が未設定の場合、保護対象画面は利用できません。`/login` に設定不足の通知が表示されます。

## External Exposure

この実装は、信頼できる LAN 内での簡易保護を目的としています。NextPatch を直接インターネットに公開しないでください。
インターネット公開やリモートアクセスが必要な場合は、この実装だけでは不十分です。別途 HTTPS、リバースプロキシ、ファイアウォール、アクセス制御、バックアップ運用などを設計し、HTTPS 終端時は `NEXTPATCH_COOKIE_SECURE=true` を設定してください。
