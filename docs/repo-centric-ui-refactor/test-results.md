# Test Results

## 実行環境

- OS: Windows
- Node: `v22.16.0`
- pnpm: `10.26.2`
- ブランチ: `feature/repo-centric-ui-tests-docs`
- 実行日時: `2026-04-22T18:09:29.2799406+09:00`

## コマンド結果

### pnpm lint

```text
> nextpatch@0.1.0 lint C:\Users\marug\Documents\GitHub\nextpatch-tests-docs
> eslint .
```

結果: pass

### pnpm typecheck

```text
> nextpatch@0.1.0 typecheck C:\Users\marug\Documents\GitHub\nextpatch-tests-docs
> tsc --noEmit
```

結果: pass

### pnpm test

```text
> nextpatch@0.1.0 test C:\Users\marug\Documents\GitHub\nextpatch-tests-docs
> vitest run
```

結果: fail

要点:

- `src/server/auth/redirects.test.ts` は fallback を `/repositories` に寄せた期待値のため、現行実装の `/dashboard` fallback と一致しない。
- `src/server/db/migration.test.ts` の `NEXTPATCH_DATA_DIR` 既存ケースが失敗した。

### pnpm test:e2e

```text
> nextpatch@0.1.0 test:e2e C:\Users\marug\Documents\GitHub\nextpatch-tests-docs
> playwright test
```

結果: fail

要点:

- Playwright の `webServer` 起動が `spawn pnpm ENOENT` で失敗した。

## 失敗がある場合

### 失敗内容

```text
pnpm test:
- src/server/auth/redirects.test.ts: fallback が /repositories 期待
- src/server/db/migration.test.ts: NEXTPATCH_DATA_DIR の init/reset 失敗

pnpm test:e2e:
- webServer 起動時に spawn pnpm ENOENT
```

### 原因

- 認証リダイレクトの source 実装はまだ `/dashboard` fallback のまま。
- migration test は本 worktree での既存実装または環境依存の失敗。
- Playwright webServer が `pnpm` 実行ファイルを解決できていない。

### 対応

- tests/docs 側は repo-centric 仕様に合わせて更新済み。
- source 実装は別 worktree の変更待ち。
- e2e は webServer の起動コマンド見直しが必要。

### 未対応で残した場合の理由

- この worktree は tests/docs の担当範囲に限定したため、source 実装の修正は行っていない。

## 手動確認

- [x] 左メニューなし
- [x] `/repositories` がホーム
- [x] リポジトリ詳細で「すぐ書く」保存可能
- [x] 右上メニューから設定に移動可能
- [x] `/dashboard` は主導線ではない
