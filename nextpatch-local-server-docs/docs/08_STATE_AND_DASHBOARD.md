# 状態遷移・ダッシュボードロジック

## 基本方針

状態名は種別ごとに自然な言葉を使う。一方、ダッシュボードや集計では共通 lifecycle に正規化する。

- 表示状態: タスクの「作業中」、バグの「再現済み」、アイデアの「採用済み」など。
- 共通判定: `open` / `closed` / `completed` / `archived`。
- `closed` と `completed` は分ける。
- `archived` は状態ではなく `archived_at` による表示制御。

## 種別ごとの状態

| 種別 | open状態 | completed状態 | closedだがcompletedでない状態 |
|---|---|---|---|
| task | 未整理, 着手待ち, 作業中, レビュー待ち, ブロック中, 保留 | 完了 | 中止, 重複 |
| bug | 未確認, 再現確認待ち, 再現済み, 調査中, 修正中, 修正済み・確認待ち, 保留 | 解決済み | 再現不能, 仕様通り, 対応不要, 重複 |
| idea | 未整理, 検討中, 有望, 保留 | タスク化済み, 採用済み | 却下, 重複 |
| tech_candidate | 未調査, 調査中, 比較中, PoC中, 保留 | 採用決定 | 不採用, 置換済み |
| reference_service | 未確認, 調査中, 保留 | 要点整理済み, アイデア化済み, 採用候補化済み | 見送り, リンク切れ |
| memo | 未整理, 整理中, 保留 | アイテム化済み, 記録のみ | 破棄, 重複 |

## 状態遷移表

| 遷移元 | 遷移先 | 条件 | completedAt | closedAt |
|---|---|---|---|---|
| open | open | 通常進行 | 変更しない | 変更しない |
| open | completed=true closed | 完了/解決/採用/整理完了 | 未設定なら現在時刻 | 現在時刻 |
| open | completed=false closed | 却下/中止/再現不能/対応不要/重複 | 設定しない | 現在時刻 |
| completed=true closed | open | 再オープン/差し戻し | null | null |
| completed=false closed | open | 再検討/再現/対応再開 | 変更なし | null |
| 任意 | archive | 通常一覧から隠す | 変更しない | 変更しない |
| archive | unarchive | 再表示 | 変更しない | 変更しない |

## バグ修正日との関係

- `bug_details.fixed_at`: 修正を入れた日。
- `work_items.completed_at`: 修正確認まで完了し、解決済みになった日。
- `修正済み・確認待ち` では `fixed_at` は設定可、`completed_at` は未設定。

## アイデアの完了扱い

- `タスク化済み`: アイデア処理の完了。実装完了ではない。
- `採用済み`: 方針採用の完了。
- `却下`: closed=true、completed=false。

## 採用候補の採用済み扱い

- `採用決定`: completed=true、tech_note.adoption_status=adopted。
- `不採用`: completed=false。
- `置換済み`: completed=false、後継候補へ関連を張る。

## ダッシュボード表示セクション

| 表示順 | セクション | 表示条件 | 件数 |
|---:|---|---|---:|
| 1 | 今やるべき | open、非archive、保留以外、tier高 | 5〜10 |
| 2 | 実稼働中リポジトリの重大バグ | active_production かつ bug S0〜S2 open | 5 |
| 3 | 次バージョン対象 | targetVersionId が repo.nextVersionId かつ open | 5〜10 |
| 4 | ブロック中・確認待ち | blocked/review/再現確認待ち/修正済み確認待ち | 5〜10 |
| 5 | 未整理メモ | memo 未整理、非archive | 5 |
| 6 | 最近完了した項目 | completedAt 直近7日以内 | 10 |
| 7 | 保留中 | 保留で更新が古い | 任意 |

## 今やるべき度のMVPルール

| Tier | 意味 | 条件 |
|---:|---|---|
| 0 | 固定表示 | isPinned=true かつ open |
| 1 | 最優先 | 実稼働 repo の S0/S1 バグ、または P0 |
| 2 | 高優先 | 次version P0/P1、実稼働 repo の S2 バグ |
| 3 | 直近対応 | dueAt 3日以内、レビュー待ち、修正済み確認待ち |
| 4 | 整理必要 | 未整理で3日以上経過した memo/idea/task |
| 5 | 通常 | その他の open |
| 除外 | 表示しない | closed、archived、保留、破棄、重複 |

## 理由チップ

- `手動固定`
- `P0`
- `実稼働重大バグ`
- `次バージョン対象`
- `期限近い`
- `確認待ち`
- `未整理3日以上`

## 将来のスコアリング案

```text
score = priorityScore
      + severityScore
      + productionRepoBonus
      + nextVersionBonus
      + dueDateUrgency
      + blockerAttentionBonus
      + pinnedBonus
      - onHoldPenalty
      - archivedPenalty
```

MVPでは導入しない。まず固定ルールで説明可能性を優先する。
