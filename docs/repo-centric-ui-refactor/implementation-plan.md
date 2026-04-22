# 実装計画: NextPatch リポジトリ中心UI改修

## 1. 改修の目的

NextPatch を「小さな横断管理ツール」ではなく、`リポジトリごとの作業メモ帳` として使えるようにする。

現在の UI は、Dashboard、Repositories、Work Items、Inbox、Capture、Ideas、Tech Notes、References が並び、利用者が「どこに書けばよいか」を考える必要がある。

改修後は、利用者が以下だけを考えればよい構造にする。

```text
どのリポジトリか
何を書くか
```

## 2. 最終UI構造

```text
NextPatch
└─ リポジトリ
   ├─ リポジトリ一覧
   └─ リポジトリ詳細
      ├─ 現在の焦点
      ├─ すぐ書く
      └─ メモ・タスク一覧

右上メニュー
└─ 設定
   ├─ データ管理
   └─ システム状態
```

## 3. 主導線

### リポジトリにメモ・タスクを書く

```text
/repositories
→ 対象リポジトリを開く
→ 「すぐ書く」に入力して保存
```

### 設定を開く

```text
右上メニュー
→ 設定
```

### データ管理を開く

```text
右上メニュー
→ データ管理
```

## 4. ルーティング方針

| ルート | 改修後 |
|---|---|
| `/` | `/repositories` へリダイレクト |
| `/repositories` | ホーム画面 |
| `/repositories/[repositoryId]` | リポジトリ作業画面 |
| `/settings` | 右上メニューから到達 |
| `/settings/data` | 右上メニューから到達 |
| `/settings/system` | 右上メニューから到達 |
| `/dashboard` | 互換目的で `/repositories` へリダイレクト |
| `/work-items` | 互換目的で `/repositories` へリダイレクト |
| `/inbox` | 互換目的で `/repositories` へリダイレクト |
| `/capture/new` | 互換目的で `/repositories` へリダイレクト |
| `/ideas` | 互換目的で `/repositories` へリダイレクト |
| `/tech-notes` | 互換目的で `/repositories` へリダイレクト |
| `/references` | 互換目的で `/repositories` へリダイレクト |
| `/work-items/[workItemId]` | 当面維持。詳細からリポジトリへ戻る導線を追加できるなら追加 |

旧ルートは `isProtectedPath` には残してよい。未認証アクセス時はまずログイン保護され、ログイン後は安全な `next` または `/repositories` に到達する。

## 5. UIシェル改修

### 対象ファイル

```text
src/app/(app)/layout.tsx
src/app/globals.css
```

### 実装内容

- `navItems` を削除。
- `<aside className="sidebar">` を削除。
- `.app-frame` のサイドバーグリッドを廃止。
- `topbar` を全ページ共通の上部ヘッダーにする。
- 左側に `NextPatch` ブランドリンクを置く。
- `NextPatch` のリンク先は `/repositories`。
- 右側に `details` / `summary` ベースのメニュー、またはアクセシブルなメニューボタンを置く。
- メニュー内に `設定`、`データ管理`、`システム状態`、`ログアウト` を置く。
- `Quick Capture` ボタンはトップバーから削除する。

### 期待される見た目

```text
NextPatch                                      [メニュー ▾]
```

メニュー展開時:

```text
設定
データ管理
システム状態
ログアウト
```

## 6. 既定遷移先の変更

### 対象ファイル

```text
src/app/page.tsx
src/app/(auth)/login/page.tsx
src/proxy.ts
src/server/auth/actions.ts
src/server/auth/redirects.ts
src/server/auth/redirects.test.ts
```

### 変更内容

`/dashboard` を既定遷移先にしている箇所を `/repositories` に変更する。

特に以下を確認する。

- `sanitizeNextPath` の fallback。
- `loginAction` の fallback。
- 認証済みで `/login` に来た場合の redirect。
- `src/app/page.tsx` の redirect。
- `proxy.ts` の authenticated login redirect。
- テスト期待値。

推奨実装:

```ts
export const DEFAULT_AUTH_REDIRECT_PATH = "/repositories";
```

を `src/server/auth/redirects.ts` に置き、fallback を集約する。

## 7. リポジトリ一覧のホーム化

### 対象ファイル

```text
src/app/(app)/repositories/page.tsx
src/server/db/queries/repositories.ts
src/server/db/queries/work-items.ts
src/server/types.ts
```

### 画面目的

`/repositories` はアプリのホームである。ダッシュボード的な横断情報を出しすぎず、リポジトリカードを中心にする。

### 表示する情報

各リポジトリカードには以下を表示する。

```text
リポジトリ名
GitHub owner/repo
現在の焦点
未完了件数
メモ件数
最終更新
開くリンク
```

`production_status` と `criticality` は小さな補助バッジとして表示してよいが、主役にしない。

### 追加クエリ

推奨: `listRepositorySummaries(workspaceId)` を追加する。

返却例:

```ts
type RepositorySummaryRow = RepositoryRow & {
  open_item_count: number;
  memo_count: number;
  last_activity_at: string | null;
};
```

実装方針:

- DB schema は変えない。
- `repositories` と `work_items` を取得し、TypeScript側で集計してよい。
- 未完了判定は `src/server/domain/status.ts` の `isOpen` を使う。
- `archived_at` / `deleted_at` がある項目は除外する。
- `last_activity_at` は repository の `updated_at` と関連 work item の `updated_at` の最大値にする。

## 8. リポジトリ追加フォームの簡素化

### 現在

- リポジトリ名
- GitHub URL
- 稼働状態
- 重要度
- 現在の焦点

### 改修後の見せ方

主項目:

```text
リポジトリ名
GitHub URL
現在の焦点
```

補助項目:

```text
稼働状態
重要度
```

稼働状態と重要度は内部的には維持する。フォームでは下に置くか、視覚的に弱くする。

## 9. リポジトリ詳細の中心画面化

### 対象ファイル

```text
src/app/(app)/repositories/[repositoryId]/page.tsx
src/server/actions/repositories.ts
src/server/actions/work-items.ts
src/server/actions/capture.ts
src/server/validation/schemas.ts
```

### 画面構造

```text
リポジトリ名
GitHub owner/repo / 状態バッジ

現在の焦点
[ textarea or input ] [保存]

すぐ書く
[ 内容 textarea ]
種類: メモ / タスク / バグ
優先度: 普通
[保存]

メモ・タスク
- ...
```

### 現在の焦点編集

`updateRepositoryFocus` を追加する。

入力:

```text
id
currentFocus
```

処理:

- workspace scope を確認。
- `repositories.currentFocus` と `updatedAt` を更新。
- `/repositories` と `/repositories/[id]` を revalidate。
- `/repositories/[id]` に戻る。

DBクエリ側には `updateRepositoryFocusCommand(workspaceId, id, currentFocus)` を追加する。

### すぐ書くフォーム

`WorkItem 追加` を廃止し、`すぐ書く` にする。

必須項目:

```text
内容
```

任意または既定値あり:

```text
種類: memo / task / bug
タイトル: 任意
優先度: p2
```

タイトル未入力時は本文の先頭行から生成する。

```ts
function titleFromBody(value: string) {
  return value.split(/\r?\n/).find(Boolean)?.slice(0, 80) || "Untitled memo";
}
```

### バリデーション

`workItemSchema.title` を必須のままにするなら、action 側で先にタイトルを生成してから parse する。

推奨は次のどちらか。

1. `workItemSchema.title` を optional にし、action で fallback する。
2. repository detail の quick write 専用 schema を作る。

影響範囲が小さいのは 1。

## 10. 作成後の遷移

現在の `createWorkItem` は保存後に `/work-items/[id]` へ飛ぶ。改修後はリポジトリ中心にする。

| 条件 | 保存後 |
|---|---|
| `repositoryId` あり | `/repositories/[repositoryId]` |
| `repositoryId` なし | `/repositories` |

`quickCapture` も repositoryId ありなら `/repositories/[repositoryId]` に戻す。ただし `/capture/new` 自体はトップUIから消え、互換ルートとして `/repositories` redirect にする。

## 11. 旧ページの扱い

以下はページとして残す必要がない。安全のため削除ではなく redirect にする。

```text
src/app/(app)/dashboard/page.tsx
src/app/(app)/work-items/page.tsx
src/app/(app)/inbox/page.tsx
src/app/(app)/capture/new/page.tsx
src/app/(app)/ideas/page.tsx
src/app/(app)/tech-notes/page.tsx
src/app/(app)/references/page.tsx
```

実装例:

```tsx
import { redirect } from "next/navigation";

export default function OldPage() {
  redirect("/repositories");
}
```

`/work-items/[workItemId]` は当面維持してよい。リポジトリに紐づく item なら、詳細画面に `/repositories/[repositoryId]` へ戻るリンクを追加する。

## 12. CSS改修

### 対象ファイル

```text
src/app/globals.css
src/styles/tokens.css
```

`tokens.css` は必要な場合のみ変更する。

### 削除または未使用化

```text
.sidebar
.sidebar__brand
.nav-link
.mobile-menu
```

### 追加候補

```text
.topbar__brand
.topbar__right
.topbar-menu
.topbar-menu__panel
.repository-card
.repository-card__focus
.quick-write
.stat-row
```

### モバイル

- 左メニューは復活させない。
- ボトムナビは作らない。
- 右上メニューは `details` などで展開できればよい。
- ボタンは十分な押下領域を確保する。

## 13. テスト計画

### E2E

`tests/e2e/sqlite-smoke.spec.ts` を更新する。

主な流れ:

```text
/api/export/json が未認証で 401
未認証で /repositories → /login?next=%2Frepositories
不正ログインと空ログインのエラー表示
正しいログイン → /repositories
リポジトリ作成 → /repositories/[id]
詳細画面で現在の焦点を編集
詳細画面で「すぐ書く」からタスク作成
保存後も同じ詳細画面
状態変更ボタンがあれば状態変更
右上メニューから /settings/data へ移動
export links を確認
ログアウト → /login
ログアウト後 /repositories → /login?next=%2Frepositories
```

### Unit

- `src/server/auth/redirects.test.ts`
- `src/server/db/queries.test.ts`
- `src/server/validation/schemas.test.ts`

確認すること:

- fallback が `/repositories`。
- `/dashboard` など旧ルートは protected のまま。
- repository summary が archived/deleted を除外する。
- `createWorkItem` が title 未入力 + body 入力で作成できる。

## 14. ドキュメント更新

対象:

```text
README.md
AGENTS.md
docs/repo-centric-ui-refactor/final-report.md
docs/repo-centric-ui-refactor/test-results.md
```

変更点:

- `/dashboard` を既定導線として説明しない。
- ログイン後の遷移先を `/repositories` にする。
- 左メニューではなく右上メニューを説明する。
- `Work Items` は内部モデルとして残るが、主要UI名ではないことを書く。

## 15. 受け入れ条件

`acceptance-checklist.md` を参照。
