# サブエージェント01: プロジェクト基盤・ローカル実行

あなたは NextPatch のプロジェクト基盤とローカル実行基盤を担当します。
必ず個別 worktree で作業してください。

```bash
git worktree add ../nextpatch-foundation -b feature/project-foundation
cd ../nextpatch-foundation
```

## 参照ドキュメント

- `docs/01_MASTER_PLAN_LOCAL_SERVER.md`
- `docs/13_TECH_ARCHITECTURE_LOCAL_SERVER.md`
- `docs/19_IMPLEMENTATION_PLAN.md`
- `docs/20_TASK_BREAKDOWN.md`

## 作業内容

1. Next.js App Router + TypeScript の基盤を作成する。
2. pnpm を前提に package scripts を整備する。
3. lint, typecheck, test, build の基本 scripts を用意する。
4. Vitest と Playwright の初期設定を用意する。
5. `next.config` に local server / standalone build を見据えた構成を入れる。
6. Dockerfile, .dockerignore, docker-compose の初期案を作る。
7. `.env.example` を作る。秘密情報は入れない。
8. README に開発起動手順と常用ローカル起動手順の最小版を書く。

## 制約

- GitHub API や OpenAI API は実装しない。
- DB schema の詳細は DB/Auth担当と競合しないよう、placeholder までに留める。
- 認証なし標準モードを作らない。

## 受け入れ条件

- `pnpm install` 後に `pnpm build` が通る。
- Docker build の方針が README に書かれている。
- `.env.example` に Supabase local 接続項目がある。
- 変更ファイル一覧、テスト結果、未対応事項を報告する。
