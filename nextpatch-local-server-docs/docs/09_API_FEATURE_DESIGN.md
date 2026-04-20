# API・機能設計

## 基本方針

MVP の内部操作は Server Actions を中心にし、外部連携・export/import・将来webhookは Route Handlers に分ける。

- UI から直接 Supabase query を呼ばない。
- DB access は `src/server/repositories/*` に閉じる。
- 状態遷移、dashboard tier、GitHub URL parser、import parser は domain service に置く。
- 入力検証は Zod を server-side で必ず行う。

## 機能一覧

| 機能 | 入力 | 処理 | 出力 | 権限 | 備考 |
|---|---|---|---|---|---|
| リポジトリCRUD | name, GitHub URL, description | URL解析、owner/repo保存、CRUD | Repository | owner | API同期なし |
| WorkItem CRUD | type, title, body, repoId, status | 型別detail含めて保存 | WorkItem | owner | transaction |
| タスク完了 | itemId | 状態遷移検証、completedAt設定 | updated item | owner | undo候補 |
| バグ修正済み | itemId, fixedAt任意 | bug status更新、fixedAt/ completedAt整理 | updated bug | owner | 解決済みは確認後 |
| 未整理メモ登録 | rawContent, repoId任意 | memoとして原文保存 | Memo WorkItem | owner | JSON解析失敗でも保存 |
| 未整理メモ分類 | memoId, targetType, fields | 元メモ保持、分類先作成、履歴保存 | created item | owner | transaction |
| アイデア登録 | title, hypothesis等 | idea detail 作成 | Idea | owner | repoId nullable可 |
| 技術メモ登録 | name, category, adoptionStatus | tech_note保存 | TechNote | owner | candidate/adopted |
| 参考サービス登録 | name, url, referencePoint | reference_service保存 | ReferenceService | owner | URL検証 |
| 検索・絞り込み | query, type, status, repo, tag | owner範囲で検索 | list | owner | repositoryId null対応 |
| ダッシュボード取得 | workspaceId | tier別集計 | dashboard sections | owner | 説明理由付き |
| エクスポート | scope, format | JSON/Markdown/CSV生成 | file/log | owner | JSONが正本 |

## Server Actions 候補

```text
createRepository
updateRepository
archiveRepository
createWorkItem
updateWorkItem
updateWorkItemStatus
archiveWorkItem
quickCapture
classifyMemoCandidate
applyClassificationCandidate
createTechNote
createReferenceService
createJsonExport
createMarkdownExport
createCsvExport
validateImport
restoreToNewWorkspace
```

## Route Handlers 候補

```text
GET  /api/export/json
GET  /api/export/markdown
GET  /api/export/csv
POST /api/import/validate
POST /api/import/restore
GET  /api/system/status
```

将来:

```text
POST /api/integrations/github/webhook
POST /api/integrations/github/sync
POST /api/ai/classify-memo
POST /api/chatgpt/actions/import
```

## 状態変更 API の責務

`updateWorkItemStatus` は単純な status 保存ではなく、以下を実行する。

1. 種別に対して有効な状態か確認。
2. 許可された遷移か確認。
3. 遷移前後の completed/closed 判定を比較。
4. completedAt/closedAt を設定またはクリア。
5. status_histories を保存。
6. dashboard の再取得に必要な invalidation を行う。

## エラー形式

```json
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "入力内容を確認してください。",
  "fieldErrors": {
    "title": ["＊タイトルを入力してください。"]
  }
}
```

## 権限チェック順序

1. セッション確認。
2. CSRF 検証。
3. 入力 schema 検証。
4. `workspaceId + membership` で対象取得。
5. 権限判定。
6. 実行。
7. 監査イベント記録。
8. レスポンス。
