# MVPスコープ定義

## MVPに必ず含める機能

| 機能 | 内容 | 完了条件 |
|---|---|---|
| ローカル実行基盤 | `supabase start` + `pnpm dev`、常用 `docker compose up -d` | README通り起動できる |
| 認証 | Supabase Auth。メール OTP / magic link | 未ログインで本体アクセス不可 |
| Repository CRUD | 手動登録、GitHub URL解析、アーカイブ | owner/repo が保存される |
| WorkItem CRUD | task / bug / idea / implementation / future_feature / memo | repositoryId null も扱える |
| バグ詳細 | severity、再現手順、期待/実際結果、環境 | バグ詳細を検索・表示できる |
| アイデア詳細 | 仮説、対象ユーザー、実現性、採用判断 | idea から task 化できる |
| 技術メモ | 採用済み、候補、評価中、却下、廃止 | candidate→adopted を表現できる |
| 参考サービス | URL、参考ポイント、良い点、懸念点 | 外部リンクを明確に表示できる |
| 未整理メモ | ChatGPT貼り付け原文を保存 | JSON不正でも保存できる |
| 未整理メモ分類 | memo から各種 item へ変換 | 元メモが残る |
| 状態変更 | 完了、修正済み、採用済み等 | completedAt/closedAt が正しい |
| ダッシュボード | 今やるべき、重大バグ、未整理、最近完了 | 理由チップが表示される |
| 検索・絞り込み | repo/type/status/priority/tag | 複合条件が効く |
| JSON export | 復元可能な正本バックアップ | round-trip テスト通過 |
| Markdown/CSV export | 読み物・棚卸し用補助出力 | 用途注意が表示される |
| DADS準拠UI | フォーム、ボタン、通知、ナビ | a11y チェック通過 |

## MVPでは簡易実装にする機能

- GitHub 連携: URL解析と手動リンクまで。
- ChatGPT 連携: 手動貼り付け、標準プロンプト、JSON/Markdown parser まで。
- PWA: manifest とアイコンまで。
- System settings: runtime/DB/Auth/export状態の表示まで。
- 監査ログ: 主要操作の記録まで。詳細 UI は後回し。
- Import: JSON検証 + 新規workspace復元まで。

## MVPから外す機能

- SaaS公開
- チーム共有 / RBAC UI
- GitHub OAuth / App / token 保存 / Issue同期
- OpenAI API 自動分類
- ChatGPT App / MCP / GPT Actions
- 添付ファイル管理
- カンバンのドラッグ＆ドロップ
- 高度ロードマップ / ガント / 分析
- 通知 / リマインダー
- 既存 workspace へのマージ復元
- ダークモード

## 将来拡張

| フェーズ | 拡張候補 |
|---|---|
| P1 | GitHub read-only import、AI分類候補、Markdown vault export強化、Sentry連携 |
| P2 | GitHub Issue作成、双方向同期、Codex prompt生成、共有機能 |
| P3 | チーム機能、GitHub Projects連携、高度ロードマップ、暗号化export |
