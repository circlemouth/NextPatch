# リスク一覧・未決定事項一覧

## リスク一覧

| リスク | 影響 | 発生しやすさ | 対策 | MVPでの扱い |
|---|---|---|---|---|
| TODOアプリ化 | 独自価値が消える | 中 | source/reason/nextAction を持たせる | 監視 |
| GitHub管理ツール化 | スコープ肥大 | 高 | MVPはURL解析まで | 固定 |
| AI依存 | コスト/誤分類/機密送信 | 中 | MVPはAI送信なし | 除外 |
| ローカルデータ喪失 | 致命的 | 中 | JSON export、DB backup手順 | 必須 |
| 認証なし運用 | 情報漏えい | 中 | 認証必須 | 必須 |
| RLSミス | 他ユーザーデータ漏えい | 低〜中 | RLS test/IDOR test | 必須 |
| Docker/Supabase自ホスト複雑 | 起動不能 | 中 | dev/local-serverを分ける | README必須 |
| 未整理メモが溜まる | ダッシュボードがノイズ化 | 高 | 未整理セクションとtriage導線 | 必須 |
| 状態定義が多すぎる | 入力負荷 | 中 | 表示状態は自然、内部判定は共通 | 採用 |
| DADS未整備UIの独自化 | 一貫性低下 | 中 | 暫定案として明記 | 必須 |
| スマホUI肥大 | 使いづらい | 高 | スマホは登録/確認/状態更新に限定 | 固定 |
| Export復元失敗 | 信頼低下 | 中 | round-trip test | 必須 |
| GitHub URL解析ミス | 将来連携データが壊れる | 中 | parser unit test | 必須 |
| completedAt不整合 | 進捗表示が信用できない | 中 | 状態遷移serviceとテスト | 必須 |
| バックアップのGit誤コミット | 機密漏えい | 中 | warning, .gitignore, README | 必須 |
| SMTP未設定 | ログインできない | 中 | dev/production手順を分ける | 必須 |

## 未決定事項一覧

| 未決定事項 | 決定が必要な理由 | 候補 | 推奨 | 決定タイミング |
|---|---|---|---|---|
| Supabase self-host compose の同梱範囲 | 公式構成の追従が必要 | 直接同梱 / 参照手順 / submodule | 参照手順 + local stack優先 | 実装基盤時 |
| SMTP設定の標準 | Authメール配送が必要 | 開発用のみ / SMTP必須 | devはlocal、常用はSMTP README | 認証実装時 |
| Tailwind採用 | UI実装方式に影響 | Tailwind / CSS Modules | Tailwind + token または CSS variables | UI基盤時 |
| Markdown sanitizer | XSS対策 | rehype-sanitize等 / plain text | sanitizer採用 | WorkItem本文実装時 |
| closedAt採用 | completedAtと終了日分離 | 採用 / 不採用 | 採用 | DB実装前 |
| import復元範囲 | ローカル運用信頼性 | 新規workspaceのみ / 既存マージ | 新規workspaceのみ | Export実装時 |
| GitHub Level 2 時期 | 連携価値 | MVP後すぐ / 利用後 | 利用ログ後 | MVP後 |
| AI分類時期 | コスト/機密 | P1 / P2 | P1後半以降 | 手動triage評価後 |
| 添付ファイル | バグ再現に有用 | URLのみ / Storage | MVPはURLのみ | P1検討 |
| 外部公開 | LAN外利用需要 | 非推奨 / HTTPS必須で許可 | MVP非推奨 | 運用直前 |
| バックアップ暗号化 | ローカル保存の安全性 | MVP後 / MVP | MVP後。ただし警告はMVP | Export実装時 |
| seed data | QA効率 | あり / なし | あり | テスト実装時 |
