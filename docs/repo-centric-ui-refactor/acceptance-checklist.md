# 受け入れチェックリスト

## UI構造

- [ ] 左メニューが存在しない。
- [ ] DOM上に `aside.sidebar` が残っていない。
- [ ] トップバー左に `NextPatch` ブランドリンクがある。
- [ ] `NextPatch` ブランドリンクは `/repositories` に向く。
- [ ] トップバー右にメニューがある。
- [ ] 右上メニューから `設定` に到達できる。
- [ ] 右上メニューから `データ管理` に到達できる。
- [ ] 右上メニューから `システム状態` に到達できる。
- [ ] 右上メニューまたは同等の場所からログアウトできる。
- [ ] トップバーに `Quick Capture` ボタンがない。
- [ ] モバイル幅でも左メニューが出ない。
- [ ] モバイル幅でもボトムナビゲーションを使っていない。

## ルーティング

- [ ] `/` は `/repositories` に遷移する。
- [ ] ログイン後の既定遷移先は `/repositories`。
- [ ] 認証済みで `/login` に来た場合は `/repositories` に遷移する。
- [ ] `sanitizeNextPath` の unsafe fallback は `/repositories`。
- [ ] `/dashboard` はトップUIから消えている。
- [ ] `/dashboard` 直アクセスは `/repositories` にリダイレクトされる。
- [ ] `/work-items` 直アクセスは `/repositories` にリダイレクトされる。
- [ ] `/inbox` 直アクセスは `/repositories` にリダイレクトされる。
- [ ] `/capture/new` 直アクセスは `/repositories` にリダイレクトされる。
- [ ] `/ideas` 直アクセスは `/repositories` にリダイレクトされる。
- [ ] `/tech-notes` 直アクセスは `/repositories` にリダイレクトされる。
- [ ] `/references` 直アクセスは `/repositories` にリダイレクトされる。
- [ ] 旧ルートは未認証時にログイン保護される。

## リポジトリ一覧

- [ ] `/repositories` がホームとして機能する。
- [ ] h1 は `リポジトリ`。
- [ ] リポジトリカードにリポジトリ名が表示される。
- [ ] GitHub full name がある場合は表示される。
- [ ] 現在の焦点が表示される。
- [ ] 未完了件数が表示される。
- [ ] メモ件数が表示される。
- [ ] 最終更新が表示される。
- [ ] リポジトリカードから詳細画面を開ける。
- [ ] リポジトリ追加フォームは主要項目が `リポジトリ名 / GitHub URL / 現在の焦点` に整理されている。
- [ ] 稼働状態と重要度は補助的な扱いになっている。

## リポジトリ詳細

- [ ] `/repositories/[repositoryId]` が中心作業画面になっている。
- [ ] リポジトリ名が h1 として表示される。
- [ ] 現在の焦点を編集できる。
- [ ] 現在の焦点保存後、同じ詳細画面に戻る。
- [ ] `すぐ書く` フォームがある。
- [ ] `すぐ書く` は内容 textarea を中心にしている。
- [ ] `すぐ書く` の種類は `メモ / タスク / バグ` 程度に絞られている。
- [ ] タイトル未入力でも本文先頭行からタイトルが作られる。
- [ ] 保存後、同じ `/repositories/[repositoryId]` に戻る。
- [ ] 保存したメモ・タスクが一覧に表示される。
- [ ] 一覧の見出しは `メモ・タスク`。
- [ ] 状態変更がある場合も詳細画面内で完結する。

## 用語

- [ ] 主要UIから `WorkItem` という表記が消えている。
- [ ] 主要UIから `Inbox` という表記が消えている。
- [ ] 主要UIから `Capture` という表記が消えている。
- [ ] 主要UIから `Ideas`、`Tech Notes`、`References` がトップ導線として消えている。
- [ ] 内部テーブルや型名としての `work_items` は残っていてよい。

## アクセシビリティ・DADS準拠

- [ ] フォーム項目には明示的な label がある。
- [ ] placeholder に説明を依存していない。
- [ ] 必要な補足説明は support text として表示される。
- [ ] 重要情報をアコーディオン等に隠していない。
- [ ] 主要ボタンは1画面1主目的を意識している。
- [ ] disabled ボタンに依存していない。
- [ ] クリック/タップ対象は十分な高さを確保している。
- [ ] focus-visible が確認できる。

## テスト

- [ ] `pnpm lint` が通る。
- [ ] `pnpm typecheck` が通る。
- [ ] `pnpm test` が通る。
- [ ] `pnpm test:e2e` が通る。
- [ ] E2Eの主導線は `/repositories` 起点になっている。
- [ ] 未認証 `/repositories` が `/login?next=%2Frepositories` になる。
- [ ] ログイン成功後 `/repositories` に着地する。
- [ ] リポジトリ作成後、詳細画面に遷移する。
- [ ] すぐ書く保存後、詳細画面に戻る。
- [ ] 右上メニューから設定系ページへ移動できる。
- [ ] export links が `/settings/data` で確認できる。

## ドキュメント

- [ ] README の既定導線が `/repositories` になっている。
- [ ] AGENTS.md の `/dashboard` 前提が更新されている。
- [ ] `docs/repo-centric-ui-refactor/final-report.md` がある。
- [ ] `docs/repo-centric-ui-refactor/test-results.md` がある。
- [ ] `docs/repo-centric-ui-refactor.zip` が生成されている。
