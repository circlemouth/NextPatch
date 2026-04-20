# 情報設計・サイトマップ

## 基本方針

NextPatch は「情報を全部保存する」アプリではなく、「リポジトリごとの判断材料を、次の開発行動へ変換する」アプリとして設計する。

- PC: 整理、分類、判断、横断検索、詳細編集。
- スマホ: クイック登録、今やること確認、完了/修正済み更新。
- 主要導線は目的まで3操作以内。
- 重要情報は折りたたみの中に隠さない。
- タブやモーダルに依存しない。必要な場合は `NextPatch暫定ルール` として扱う。

## サイトマップ

```text
/
├── dashboard
├── repositories
│   ├── new
│   └── [repositoryId]
│       ├── edit
│       └── work-items/new
├── work-items
│   └── [workItemId]
├── ideas
├── inbox
│   └── [memoId]/classify
├── capture/new
├── tech-notes
├── references
└── settings
    ├── data
    ├── system
    └── account
```

## 画面一覧

| 画面 | ルート | 主目的 | PCでの役割 | スマホでの役割 |
|---|---|---|---|---|
| ダッシュボード | `/dashboard` | 今やること把握 | 横断判断 | 確認・状態更新 |
| リポジトリ一覧 | `/repositories` | repo選択 | 比較・管理 | 最近repo選択 |
| リポジトリ詳細 | `/repositories/[id]` | repo作業基地 | 整理・分類・判断 | 重要項目確認 |
| WorkItem一覧 | `/work-items` | 横断検索 | 検索・棚卸し | 軽い検索 |
| アイデア一覧 | `/ideas` | 構想管理 | 採用判断 | 確認 |
| 未整理メモ | `/inbox` | triage | 分類処理 | 軽い分類 |
| クイック登録 | `/capture/new` | 取りこぼし防止 | メモ投入 | 最重要登録導線 |
| 技術メモ | `/tech-notes` | 技術判断 | 採用/候補整理 | 参照 |
| 参考サービス | `/references` | 参考整理 | 比較・登録 | URL登録 |
| 設定 | `/settings` | 運用 | export/import/system | 状態確認 |

## 主要導線

| 目的 | 開始画面 | 操作1 | 操作2 | 操作3 | 達成条件 |
|---|---|---|---|---|---|
| 今やることを見る | ダッシュボード | 今やるべきセクションを見る | 必要ならカードを開く | — | 対象と理由が分かる |
| リポジトリ別に状況を見る | 任意 | repo selector を開く | repo を選ぶ | — | repo 詳細へ移動 |
| タスクを登録する | 任意 | クイック登録 | type=task + 内容 | 保存 | task作成 |
| タスクを完了する | ダッシュボード/詳細 | 完了にする | — | — | completedAt設定 |
| バグを登録する | 任意 | クイック登録 | type=bug + 内容 | 保存 | bug作成 |
| バグを修正済みにする | ダッシュボード/詳細 | 修正済みにする | — | — | fixedAt/状態更新 |
| アイデアを登録する | 任意 | クイック登録 | type=idea + 内容 | 保存 | idea作成 |
| 未整理メモを登録する | 任意 | クイック登録 | 本文入力 | 保存 | memo保存 |
| 未整理メモを分類する | 未整理メモ | 分類する | 種類・repo選択 | 保存 | item作成 |
| 採用候補を登録する | 技術メモ | 新規 | 技術名・理由 | 保存 | tech_note作成 |
| 参考サービスを登録する | 参考サービス | 新規 | URL・参考点 | 保存 | reference作成 |

## PCレイアウト方針

- 左サイドナビ: Dashboard, Repositories, WorkItems, Inbox, Tech, References, Settings。
- 上部: repo selector, Quick Capture, user menu。
- メイン: 重要情報を初期表示。
- 右補助カラム: Summary、recent、system warning、backup notice。

## スマホレイアウト方針

- 1カラム。
- 上部にアプリ名、クイック登録、メニュー。
- ボトムナビは使わない。
- モバイルメニューは2階層以内。
- 一覧はテーブルではなくカード。
