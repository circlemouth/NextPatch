# バックアップ・エクスポート・運用設計

## 基本方針

ローカルサーバー版では、データ喪失対策をMVPの中核にする。

- JSON は唯一の可逆バックアップ形式。
- Markdown は人間が読む用、Git管理用。
- CSV は棚卸し・表計算用。
- DB dump は運用バックアップ。UI復元の正本にはしない。
- 復元は MVP では新規 workspace として行う。

## JSONエクスポート

| 項目 | 方針 |
|---|---|
| 範囲 | workspace 全体 |
| 含める | active, archived, soft deleted |
| 含めない | purged data, attachments |
| 必須メタデータ | format, schemaVersion, exportedAt, appVersion, counts, hash |
| 文字コード | UTF-8 |
| 日時 | UTC ISO 8601 |
| 用途 | 復元可能な正本 |

例:

```json
{
  "format": "nextpatch.backup",
  "schemaVersion": 1,
  "exportedAt": "2026-04-20T00:00:00.000Z",
  "app": { "name": "NextPatch", "version": "0.1.0" },
  "scope": { "type": "workspace", "workspaceId": "..." },
  "options": {
    "includeArchived": true,
    "includeDeleted": true,
    "includeAuditLogs": false,
    "includeAttachments": false,
    "redaction": "none"
  },
  "entities": {
    "workspaces": [],
    "repositories": [],
    "workItems": [],
    "bugDetails": [],
    "ideas": [],
    "techNotes": [],
    "referenceServices": [],
    "tags": [],
    "statusHistories": []
  },
  "integrity": {
    "counts": {},
    "contentHash": "sha256:..."
  }
}
```

## Markdownエクスポート

用途: 読み物、レビュー、Git管理。

```text
nextpatch-export-YYYYMMDD-HHmmss/
  README.md
  repositories/
    owner__repo/
      README.md
      backlog.md
      bugs.md
      roadmap.md
      decisions.md
      notes/
```

Markdown は復元用ではない。YAML front matter を使う場合は CommonMark 外の拡張なので `NextPatch暫定ルール` とする。

## CSVエクスポート

用途: 棚卸し、表計算。

出力候補:

```text
repositories.csv
work_items.csv
bugs.csv
ideas.csv
tech_notes.csv
reference_services.csv
tags.csv
```

CSVからの復元はMVPでは非対応。

## インポート

MVPでは JSON backup のみ検証する。

検証項目:

- JSONとして読めるか。
- `format=nextpatch.backup` か。
- 対応 `schemaVersion` か。
- 必須エンティティがあるか。
- 参照整合性があるか。
- 件数が異常でないか。
- hash が一致するか。

## 復元

MVP は新規 workspace として復元する。

- 既存 workspace へ上書きしない。
- 既存 workspace へマージしない。
- 復元は DB transaction 内で行う。
- 失敗時は rollback。
- `deletedAt` と `archivedAt` は保持する。

## アーカイブ・削除

| 操作 | 意味 | 復元 |
|---|---|---|
| archive | 通常一覧から隠す | 可 |
| soft delete | ゴミ箱相当 | 可 |
| purge | 物理削除 | 不可 |

物理削除前には自動 JSON backup を作る。

## データ移行

- export schema は `schemaVersion` 必須。
- 現行版と直前版は読み込めるようにする。
- 不明フィールドは原則無視。
- 必須フィールド欠落は検証エラー。

## 受け入れ条件

- JSON export が作成できる。
- Markdown/CSV export が作成できる。
- JSON import 検証でエラーを具体表示できる。
- 新規 workspace 復元が成功する。
- round-trip で件数、状態、日時、nullable が一致する。
- export前に機密情報警告を表示する。
