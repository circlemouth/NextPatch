# テスト計画

## 品質方針

MVPでは「データ整合性・権限・主要導線・DADS準拠」を品質ゲートにする。E2Eを増やしすぎず、状態遷移やdashboardロジックは単体/結合テストで固定する。

## 単体テスト

| 対象 | 観点 |
|---|---|
| 状態遷移 | open/closed/completed、completedAt/closedAt、再オープン |
| ダッシュボードtier | P0、重大バグ、期限、未整理、固定表示 |
| GitHub URL parser | repo URL、Issue URL、PR URL、invalid URL |
| import parser | nextpatch.import.v1 JSON、Markdown、invalid JSON |
| validation | 必須、enum、不正URL、日付、文字数 |
| repositoryId nullable | null を正常値として扱う |
| export | schemaVersion、日時、nullable、hash |

## 結合テスト

| 対象 | 観点 |
|---|---|
| API + DB | CRUD、transaction、rollback |
| Auth/RLS | 他ユーザーデータ拒否、未ログイン拒否 |
| WorkItem detail | type別テーブルとの整合性 |
| 状態変更 | DB保存値、history作成 |
| Export/Import | round-trip、新規workspace復元 |
| Search | 複合条件、日本語、repositoryId null |

## E2Eテスト

1. 新規ユーザーがログインし、空のダッシュボードを見る。
2. リポジトリを作成し、GitHub URL が解析される。
3. リポジトリ詳細でタスクを追加する。
4. repositoryId なしの未整理メモを作成する。
5. 未整理メモをバグへ分類する。
6. バグを修正済みにする。
7. タスクを完了し、completedAt が設定される。
8. 完了タスクを未完了へ戻し、completedAt が null になる。
9. 検索・絞り込みを使う。
10. スマホ幅でクイック登録する。
11. 他ユーザー item へ直接アクセスし拒否される。
12. JSON export と新規workspace復元を行う。

## アクセシビリティテスト

- axe critical/serious を 0。
- キーボードのみで主要導線を完了できる。
- フォーカスリングが見える。
- フォームに可視ラベルがある。
- エラーが静的に具体表示される。
- 状態が色だけで伝えられていない。
- リンクは下線等で識別できる。
- ボタンの押下対象が44 CSS px以上。

## レスポンシブテスト

| 幅 | 合格条件 |
|---:|---|
| 320px | 致命的横スクロールなし。主要対象は375px以上 |
| 375px | スマホ主要導線が使える |
| 390px | CTA、カード、メニューが破綻しない |
| 768px | 境界で中途半端に崩れない |
| 1024px | 2カラムが成立する |
| 1440px | 情報密度と余白が適切 |

## セキュリティテスト

- IDOR: 他ユーザーの UUID 直接指定を拒否。
- CSRF: 状態変更が保護される。
- XSS: Markdown/本文表示で script が実行されない。
- RLS: DBレベルで他workspaceを参照できない。
- secret: `.env` や key がログ/リポジトリに出ない。

## エクスポート・復元テスト

- JSON schemaVersion を含む。
- archived/deleted を含む。
- repositoryId null が保持される。
- completedAt/closedAt が保持される。
- import 検証で不正を検出できる。
- 復元失敗時に rollback される。

## リリース前チェックリスト

- [ ] `pnpm lint` 成功
- [ ] `pnpm typecheck` 成功
- [ ] `pnpm test` 成功
- [ ] `pnpm build` 成功
- [ ] Docker build 成功
- [ ] Supabase migration 成功
- [ ] E2E主要12本成功
- [ ] axe critical/serious 0
- [ ] 375/390/768/1024/1440px確認
- [ ] RLS/IDOR確認
- [ ] export/import round-trip確認
- [ ] README手順で新規環境起動確認
- [ ] secret未コミット確認
