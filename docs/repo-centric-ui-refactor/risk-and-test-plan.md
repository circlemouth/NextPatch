# リスクとテスト計画

## 1. 主なリスク

### 1.1 旧ルート削除によるE2E破損

対策:

- 旧ルートは削除せず redirect にする。
- `isProtectedPath` に旧ルートを残す。
- E2Eは新主導線 `/repositories` へ移行する。

### 1.2 CSSのサイドバー依存が残る

対策:

- `.app-frame` の grid layout を1カラム化。
- `.sidebar` と `.nav-link` の定義を削除または未使用化。
- モバイル media query で `.sidebar` を復活させない。

確認:

- DOMに `aside.sidebar` が存在しない。
- モバイル幅でも左メニューやボトムナビがない。

### 1.3 保存後に `/work-items/[id]` へ飛んでしまう

対策:

- `createWorkItem` の redirect を変更。
- repositoryId がある場合は `/repositories/[repositoryId]`。
- repositoryId がない場合は `/repositories`。

確認:

- リポジトリ詳細で「すぐ書く」保存後、同じ詳細画面に戻る。

### 1.4 title optional化による既存テスト破損

対策:

- 既存 `workItemSchema` を大きく崩さず、action内で title fallback するか、quick write 専用 schema を作る。
- body 必須のエラー文は UIでわかるようにする。

確認:

- title 未入力、body 入力で作成できる。
- body 未入力なら具体的なエラーになる。

### 1.5 repository summary 集計が archived/deleted を拾う

対策:

- repository も work item も `archived_at`、`deleted_at` を除外。
- status 判定は `isOpen` を使う。

確認:

- archived/deleted item が件数に含まれない unit test を追加。

### 1.6 設定への導線が見つけにくい

対策:

- topbar 右上のメニュー名は `メニュー` または `設定メニュー` にする。
- メニュー内に `設定`、`データ管理`、`システム状態` を明示。
- `summary` や button はキーボード操作可能にする。

確認:

- Playwrightで role/link または text から遷移できる。

## 2. テストコマンド

必須:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

必要に応じて:

```bash
pnpm test src/server/auth/redirects.test.ts
pnpm test src/server/db/queries.test.ts
pnpm test src/server/validation/schemas.test.ts
```

## 3. E2Eシナリオ

### 3.1 認証とホーム

```text
GET /api/export/json → 401
GET /repositories 未認証 → /login?next=%2Frepositories
wrong password → invalid error
blank password → required error
correct password → /repositories
h1: リポジトリ が見える
```

### 3.2 リポジトリ作成

```text
/repositories
リポジトリ名入力
GitHub URL入力
現在の焦点入力
保存
/repositories/[id] に遷移
h1 が作成したリポジトリ名
現在の焦点が見える
```

### 3.3 現在の焦点更新

```text
/repositories/[id]
現在の焦点を変更
保存
同じ詳細ページ
変更後の焦点が見える
```

### 3.4 すぐ書く

```text
/repositories/[id]
内容 textarea に本文入力
種類: タスク
保存
同じ詳細ページ
メモ・タスク一覧に本文先頭行由来のタイトルが見える
```

### 3.5 状態変更

```text
タスクカードで「着手」
status が doing
「完了」
status が done
```

状態変更ボタンが実装上存在しない場合は、このケースは unit test に寄せる。

### 3.6 設定導線

```text
右上メニューを開く
データ管理をクリック
/settings/data
JSON export / Markdown export / CSV export link を確認
各 export route が 200
```

### 3.7 ログアウト

```text
ログアウト
/login
/repositories へアクセス
/login?next=%2Frepositories
```

## 4. Unit test案

### auth redirects

- `sanitizeNextPath(undefined)` → `/repositories`
- `sanitizeNextPath("https://evil.example")` → `/repositories`
- `sanitizeNextPath("//evil.example")` → `/repositories`
- `sanitizeNextPath("/repositories?x=1")` → `/repositories?x=1`
- `isProtectedPath("/dashboard")` → true
- `isProtectedPath("/repositories/foo")` → true

### repository summaries

- active repository の件数が返る。
- archived/deleted repository は除外。
- active work item だけ open count に含む。
- closed status は open count に含まない。
- memo count は type memo の active item を数える。
- last_activity_at が repository と work item の updated_at の最大値。

### validation/action

- title 未入力 + body 入力で work item 作成可。
- body 未入力ならエラー。
- repositoryId ありなら repository scope。
- repositoryId なしなら `/repositories` に戻る。

## 5. 手動確認

- 左メニューがない。
- `/dashboard` 直アクセスは `/repositories` へリダイレクト。
- トップバーのリンクは `NextPatch` と右上メニューだけ。
- 目的到達が3操作以内。
- 主要UIで `WorkItem` の語が出ない。
- 主要UIで `Inbox`、`Capture`、`Ideas`、`Tech Notes`、`References` が出ない。
