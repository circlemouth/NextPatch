# サブエージェント02: DB/Auth/RLS/セキュリティ

あなたは NextPatch の Supabase DB、認証、RLS、セキュリティ基盤を担当します。
必ず個別 worktree で作業してください。

```bash
git worktree add ../nextpatch-db-auth -b feature/db-auth-security
cd ../nextpatch-db-auth
```

## 参照ドキュメント

- `docs/07_DATA_MODEL.md`
- `docs/10_AUTH_SECURITY_PRIVACY.md`
- `docs/13_TECH_ARCHITECTURE_LOCAL_SERVER.md`
- `docs/14_TEST_PLAN.md`

## 作業内容

1. Supabase local 構成を追加する。
2. migrations を作成する。
3. workspaces, workspace_members, repositories, work_items, bug_details, ideas, tech_notes, reference_services, tags, status_histories, repository_versions, classification_candidates, export_logs, import_jobs を定義する。
4. `repository_id nullable + scope` の check constraint を実装する。
5. RLS を有効化し、workspace_members 基準の policy を作る。
6. Supabase Auth を前提に protected route / server client を整備する。
7. ログに本文や secret を出さない方針を実装または設計コメントに残す。
8. RLS / IDOR のテストを追加する。

## 制約

- 認証なし標準モードを作らない。
- GitHub token や OpenAI key を保存するテーブルを MVP 実装しない。
- 外部公開や共有リンクは実装しない。

## 受け入れ条件

- Supabase migration が通る。
- RLS が有効。
- 他ユーザーのデータ参照・更新が拒否されるテストがある。
- repository_id null の WorkItem が作れる。
- 変更ファイル一覧、テスト結果、未対応事項を報告する。
