# 公式ドキュメント確認メモ

確認日: 2026-04-20

## Next.js self-hosting

- Next.js 公式は self-hosting の選択肢として Node.js server、Docker image、static export などを案内している。
- Next.js の `output: "standalone"` は production deployment に必要なファイルを `.next/standalone` へまとめる設定として案内されている。

参照:

- https://nextjs.org/docs/app/guides/self-hosting
- https://nextjs.org/docs/pages/api-reference/config/next-config-js/output

## Supabase local development

- Supabase CLI は local Supabase stack を管理し、Docker がサービス実行に使われる。
- `supabase init` と `supabase start` がローカルプロジェクト開始の基本コマンドとして案内されている。

参照:

- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/local-development/cli/getting-started

## Supabase self-hosting with Docker

- Supabase 公式は self-hosting with Docker を案内している。
- self-hosted 環境の Auth 設定は dashboard ではなく docker-compose.yml 等で設定する。

参照:

- https://supabase.com/docs/guides/self-hosting/docker
- https://supabase.com/docs/guides/self-hosting/auth/config

## Docker Compose

- Docker Compose は複数コンテナアプリケーションを定義・実行するツール。
- `docker compose up` はサービス用コンテナを build/recreate/start/attach し、`-d` でバックグラウンド実行できる。

参照:

- https://docs.docker.com/compose/
- https://docs.docker.com/reference/cli/docker/compose/up/
