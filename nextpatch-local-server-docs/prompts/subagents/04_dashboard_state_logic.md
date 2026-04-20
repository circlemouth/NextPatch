# サブエージェント04: 状態遷移・ダッシュボード

あなたは WorkItem 状態遷移、completedAt/closedAt、ダッシュボード tier ロジックを担当します。
必ず個別 worktree で作業してください。

```bash
git worktree add ../nextpatch-dashboard -b feature/dashboard-state-logic
cd ../nextpatch-dashboard
```

## 参照ドキュメント

- `docs/08_STATE_AND_DASHBOARD.md`
- `docs/09_API_FEATURE_DESIGN.md`
- `docs/14_TEST_PLAN.md`

## 作業内容

1. 種別ごとの状態定義を実装する。
2. open/closed/completed/archived 判定を実装する。
3. 状態変更 service を実装する。
4. completedAt/closedAt 自動設定ルールを実装する。
5. status_histories を保存する。
6. dashboard sections query を実装する。
7. tier 0〜5 の分類と理由チップを返す。
8. 状態遷移と dashboard の単体テストを追加する。

## 制約

- AIスコアリングは実装しない。
- 複雑なカンバンやドラッグ&ドロップは実装しない。
- closed と completed を混同しない。

## 受け入れ条件

- 完了時に completedAt が設定される。
- 完了解除時に completedAt が null になる。
- 修正済み確認待ちバグでは fixedAt と completedAt が分離される。
- Dashboard に今やるべき、重大バグ、未整理、最近完了が表示できるデータを返す。
- 変更ファイル一覧、テスト結果、未対応事項を報告する。
