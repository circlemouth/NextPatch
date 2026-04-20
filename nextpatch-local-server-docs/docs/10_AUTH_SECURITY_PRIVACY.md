# 認証・セキュリティ・プライバシー設計

## 基本方針

NextPatch は未公開構想、リポジトリURL、バグ、技術判断、ChatGPTメモを保存するため、MVPから private-by-default とする。ローカルサーバーでも認証必須。

## 認証方式

- Supabase Auth を採用。
- メール OTP / magic link を基本にする。
- self-hosted 常用時は SMTP 設定を README に明記。
- 開発時は Supabase local の開発用メール確認を利用する。
- 認証なし標準モードは作らない。

## userId / workspace 分離

- 全主要テーブルに `workspace_id` と `user_id` を持たせる。
- MVPは 1 user = 1 personal workspace。
- RLS は `workspace_members` を基準にする。
- API は `id` 単体で取得しない。

## データアクセス制御

| 対象 | 方針 |
|---|---|
| select | 所属 workspace のみ |
| insert | 自分が所属する workspace のみ |
| update | 自分が所属する workspace のみ |
| delete | 論理削除のみ。物理削除は明示操作 |
| export | 自分の workspace のみ |
| import | 自分の新規 workspace へ復元 |

## 公開ページ・共有機能

- MVP では公開ページなし。
- MVP では共有リンクなし。
- チーム機能なし。
- 将来共有時は期限、有効範囲、監査ログ、取り消しを必須にする。

## GitHubトークン

- MVPでは保存しない。
- GitHub OAuth / GitHub App は実装しない。
- 将来は GitHub App を第一候補にし、installation token、短命化、暗号化、revoke を設計する。

## AI連携時の本文送信

- MVPでは OpenAI API 等へ本文を送らない。
- 将来はユーザーが明示的に「AIで分類」を押した場合のみ。
- 送信前に対象本文をプレビューする。
- `privacyLevel=no_ai` は送信不可。
- API key はクライアントへ出さない。

## エラーログ方針

| 残す | 残さない |
|---|---|
| requestId | メモ本文 |
| userId | ChatGPT全文 |
| resourceType/resourceId | GitHub token |
| action | OpenAI API key |
| statusCode/errorCode | Cookie/Authorization header |
| redacted stack | DB接続文字列 |
| IP hash/userAgent hash | セッションID生値 |

## セキュリティチェックリスト

### 認証・セッション

- [ ] 未ログインでアプリ本体へアクセスできない。
- [ ] メールログイン token は単回使用・短期期限。
- [ ] ログイン試行にレート制限がある。
- [ ] Cookie は Secure / HttpOnly / SameSite=Lax 以上。
- [ ] ログアウトでセッションが無効化される。

### データ分離

- [ ] 全リソースに workspace_id と user_id がある。
- [ ] API は id 単体でリソース取得しない。
- [ ] クライアントから渡された user_id を信用しない。
- [ ] IDOR テストがある。
- [ ] RLS テストがある。

### CSRF / XSS / 入力検証

- [ ] POST / PATCH / DELETE に CSRF 対策がある。
- [ ] すべての入力に server-side validation がある。
- [ ] GitHub URL は許可形式へ正規化・検証する。
- [ ] Markdown raw HTML は無効化または sanitize。
- [ ] CSP を設定する。

### Export / Backup

- [ ] export は owner のみ。
- [ ] backup に機密情報が含まれる可能性を警告する。
- [ ] restore は新規 workspace のみ。
- [ ] 物理削除前に backup を作成する。

## ローカルサーバー運用注意

- LAN公開する場合でも認証必須。
- 外部公開する場合は HTTPS、SMTP、強い secret、定期 backup が必須。
- `.env` をコミットしない。
- `SERVICE_ROLE_KEY` は server-only。
- バックアップファイルを GitHub に自動コミットしない。
