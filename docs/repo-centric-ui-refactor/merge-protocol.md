# Worktree運用・マージ手順

## 基本方針

今回の作業は UIシェル、リポジトリ画面、テスト/文書の3系統に分ける。

すべてのサブエージェントは個別 worktree で作業する。メインエージェントは各差分を確認し、統合作業ブランチへ順番に取り込む。

## ブランチ例

```text
feature/repo-centric-ui                 統合作業ブランチ
feature/repo-centric-ui-shell           UIシェル担当
feature/repo-centric-ui-repository-pages リポジトリ画面担当
feature/repo-centric-ui-tests-docs      テスト・文書担当
```

## Worktree作成例

```bash
git status --short
git checkout -b feature/repo-centric-ui

git worktree add ../nextpatch-ui-shell -b feature/repo-centric-ui-shell HEAD
git worktree add ../nextpatch-repository-pages -b feature/repo-centric-ui-repository-pages HEAD
git worktree add ../nextpatch-tests-docs -b feature/repo-centric-ui-tests-docs HEAD
```

## サブエージェント割り当て

| サブエージェント | worktree | 主担当 |
|---|---|---|
| `ui-shell-agent` | `../nextpatch-ui-shell` | layout、routing、auth redirect、shell CSS |
| `repository-pages-agent` | `../nextpatch-repository-pages` | repositories page/detail、actions、queries、validation |
| `tests-docs-agent` | `../nextpatch-tests-docs` | E2E、unit test、README、AGENTS、docs |

## マージ順

1. `ui-shell-agent`
2. `repository-pages-agent`
3. `tests-docs-agent`

理由:

- UIシェルが土台。
- repository pages はシェル変更後の主画面を作る。
- tests/docs は最終仕様に寄せるため最後。

## マージ例

```bash
cd /path/to/NextPatch
git checkout feature/repo-centric-ui

git merge --no-ff feature/repo-centric-ui-shell
git merge --no-ff feature/repo-centric-ui-repository-pages
git merge --no-ff feature/repo-centric-ui-tests-docs
```

## コンフリクト方針

### `src/app/globals.css`

予想されるコンフリクト:

- UIシェル担当が sidebar/topbar を変更。
- repository pages 担当が card/quick-write 系 class を追加。

解決方針:

- sidebar 復活は禁止。
- topbar と repository card/quick-write 追加を両方残す。
- モバイルで sidebar や bottom nav を作らない。

### `tests/e2e/sqlite-smoke.spec.ts`

予想されるコンフリクト:

- route 変更と selector 変更。

解決方針:

- `/repositories` 起点を優先。
- `/work-items`、`/inbox`、`/capture/new` を主導線にしない。
- 右上メニュー経由の設定導線を確認する。

### `src/server/auth/redirects.ts`

解決方針:

- fallback は必ず `/repositories`。
- 旧ルートは protected path に残してよい。
- `DEFAULT_AUTH_REDIRECT_PATH` を導入した場合は全箇所で使う。

### `src/server/actions/work-items.ts`

解決方針:

- repositoryId ありの保存後 redirect は `/repositories/[repositoryId]`。
- title 自動生成を入れる。
- 既存 item detail への redirect は主導線から外す。

## サブエージェント完了時の提出物

各サブエージェントは、自分の worktree 内に以下を残す。

```text
docs/repo-centric-ui-refactor/<agent-name>-report.md
```

内容:

```text
変更概要
変更ファイル一覧
実行したテスト
未実行テストと理由
懸念点
```

## 統合後の必須確認

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Worktree cleanup

統合後、不要になった worktree は削除する。

```bash
git worktree remove ../nextpatch-ui-shell
git worktree remove ../nextpatch-repository-pages
git worktree remove ../nextpatch-tests-docs
```

ただし、削除前に各サブエージェントの report が統合作業ブランチに入っていることを確認する。
