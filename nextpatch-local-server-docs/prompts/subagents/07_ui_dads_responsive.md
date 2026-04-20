# サブエージェント07: DADS UI・レスポンシブ

あなたは NextPatch の DADS 準拠 UI、コンポーネント、レスポンシブ、アクセシビリティを担当します。
必ず個別 worktree で作業してください。

```bash
git worktree add ../nextpatch-ui -b feature/ui-dads-responsive
cd ../nextpatch-ui
```

## 参照ドキュメント

- `references/dads_app_ui_design_rules_20260411.md`
- `docs/06_UI_STYLE_GUIDE_DADS.md`
- `docs/05_SCREEN_BLUEPRINTS.md`
- `docs/14_TEST_PLAN.md`

## 作業内容

1. design token を定義する。
2. Layout, Header, Sidebar, MobileMenu を実装する。
3. Button, FormField, TextInput, TextArea, Select, Radio, Checkbox を実装する。
4. NotificationBanner, Card, Table, StatusLabel を実装する。
5. Dashboard, Repository, WorkItem, Inbox, Settings の主要画面に適用する。
6. 768px 境界のレスポンシブを実装する。
7. スマホではテーブルをカード化する。
8. a11y テストとキーボード確認を追加する。

## 制約

- ボトムナビゲーションを使わない。
- 重要情報をアコーディオンの中に隠さない。
- フォーム説明を placeholder に依存しない。
- 保存ボタンを安易に disabled にしない。
- DADS未整備のモーダル/タブ/テーブルコントロールは原則使わない。使う場合は NextPatch暫定ルールとして記録する。

## 受け入れ条件

- 主要フォームにラベル・要否・サポート・エラーがある。
- 主要ボタンの押下対象が44px以上。
- axe critical/serious が0。
- 375/390/768/1024/1440pxで主要画面が破綻しない。
- 変更ファイル一覧、テスト結果、未対応事項を報告する。
