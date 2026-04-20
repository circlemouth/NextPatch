# サブエージェント03: Repository / WorkItem ドメイン

あなたは Repository 管理、WorkItem CRUD、GitHub URL parser、型別詳細テーブルを担当します。
必ず個別 worktree で作業してください。

```bash
git worktree add ../nextpatch-domain -b feature/repository-workitem-domain
cd ../nextpatch-domain
```

## 参照ドキュメント

- `docs/04_INFORMATION_ARCHITECTURE.md`
- `docs/07_DATA_MODEL.md`
- `docs/09_API_FEATURE_DESIGN.md`
- `docs/11_GITHUB_CHATGPT_ROADMAP.md`

## 作業内容

1. Repository CRUD の Server Actions / repository layer を実装する。
2. GitHub URL parser を実装する。
3. WorkItem CRUD を実装する。
4. type=bug の場合 bug_details を transaction で扱う。
5. type=idea の場合 ideas を transaction で扱う。
6. tech_notes と reference_services の登録機能を実装する。
7. repository_id nullable と scope の扱いを UI/API 両方で保証する。
8. 検索・絞り込みの基本 query を実装する。

## 制約

- GitHub API は呼ばない。
- GitHub OAuth / App は実装しない。
- WorkItem と GitHub Issue を同一視しない。

## 受け入れ条件

- Repository を作成・編集・アーカイブできる。
- GitHub URL から owner/repo が抽出される。
- task/bug/idea/memo を作成できる。
- repositoryId null の memo を作成できる。
- 変更ファイル一覧、テスト結果、未対応事項を報告する。
