# 最終決定事項一覧

NextPatch ローカルサーバー版 MVP の最終決定事項です。詳細は `01_MASTER_PLAN_LOCAL_SERVER.md` を正本にします。

| 領域 | 最終決定 | 理由 | MVP対象 | 備考 |
|---|---|---|---|---|
| プロダクト方針 | Repo Action Hub として作る | GitHub Projects や汎用 TODO の再実装を避け、開発判断と次アクションに集中する | ○ | 「記録」より「判断」を重視 |
| MVP範囲 | Repository / WorkItem / Inbox / Dashboard / Quick Capture / Export | 連携より手動整理の価値検証を優先する | ○ | GitHub/AI は手動入口まで |
| 非スコープ | SaaS公開、チーム共有、GitHub同期、AI自動分類、添付ファイル | 認証・同期・権限・費用・運用が膨らむ | ○ | P1/P2 に回す |
| 端末方針 | PCは整理・判断、スマホは登録・確認・状態更新 | 端末ごとの利用時間と入力負荷が違う | ○ | スマホに大量整理を押し込まない |
| 実行方式 | ローカルサーバー / LAN 内サーバー / 自宅サーバー | ユーザー要望によりクラウド前提から変更 | ○ | README に起動手順必須 |
| データ保存方式 | Supabase Local/Self-hosted + PostgreSQL | RDB、Auth、RLS、migration をまとめて扱える | ○ | local stack と self-host を分ける |
| 認証 | Supabase Auth を利用し、ローカルでも認証必須 | 未公開構想・バグ・技術判断を保存するため | ○ | 認証なし標準モードは作らない |
| データモデル | WorkItem 共通モデル + 型別詳細テーブル | 横断一覧と型固有情報を両立する | ○ | `repositoryId` nullable |
| 状態定義 | 種別別表示状態 + 共通 lifecycle 判定 | 自然な状態名と横断ダッシュボードを両立する | ○ | open/closed/completed/archived |
| ダッシュボードロジック | 説明可能な tier ルール | AI なしでも理由を表示できる | ○ | スコアリングは将来 |
| GitHub連携 | MVP は Level 1: URL解析まで | OAuth/token/sync を避けつつ将来連携の土台を作る | ○ | API 呼び出しなし |
| ChatGPT連携 | MVP は手動貼り付け + 未整理メモ + JSON/Markdown 解析 | 原文を失わず、AI送信リスクを避ける | ○ | API分類は後回し |
| バックアップ | JSON export を唯一の可逆バックアップ形式にする | ローカル運用でデータ喪失対策が重要 | ○ | Markdown/CSV は補助 |
| UI方針 | DADS 参照ルール優先 | アクセシビリティ、一貫性、重要情報の露出を担保する | ○ | 未整備部品は NextPatch暫定ルール |
| テスト方針 | 単体/結合/E2E/a11y/レスポンシブ/復元を品質ゲート化 | ローカル運用でもデータ破壊・権限漏れを避ける | ○ | Playwright + axe 想定 |

## 採用しない方針

- MVPで認証なしモードを標準にしない。
- MVPで GitHub OAuth / GitHub App / GitHub token 保存をしない。
- MVPで OpenAI API にメモ本文を送らない。
- MVPでボトムナビゲーション、複雑なモーダル、タブ依存UIを採用しない。
- Markdown/CSV を復元用正本にしない。

## 開発着手時の最優先順

1. ローカル実行基盤
2. Supabase Local / Auth / RLS
3. Repository CRUD
4. WorkItem CRUD
5. 状態遷移
6. ダッシュボード
7. クイック登録 / 未整理メモ
8. Export / Import
9. DADS UI / Responsive
10. QA / Release
