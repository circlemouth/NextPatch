# サブエージェント06: Export / Backup / Import / 運用

あなたは JSON/Markdown/CSV export、JSON import検証、新規workspace復元、ローカル運用手順を担当します。
必ず個別 worktree で作業してください。

```bash
git worktree add ../nextpatch-export -b feature/export-backup
cd ../nextpatch-export
```

## 参照ドキュメント

- `docs/12_BACKUP_EXPORT_OPERATIONS.md`
- `templates/nextpatch.backup.v1.example.json`
- `docs/13_TECH_ARCHITECTURE_LOCAL_SERVER.md`
- `docs/14_TEST_PLAN.md`

## 作業内容

1. JSON export service を実装する。
2. schemaVersion, appVersion, exportedAt, counts, hash を含める。
3. Markdown export service を実装する。
4. CSV export service を実装する。
5. JSON import validate を実装する。
6. 新規workspace復元を transaction で実装する。
7. export_logs と import_jobs を記録する。
8. `/settings/data` 画面を実装する。
9. README に backup/restore/DB dump/volume 注意を書く。

## 制約

- Markdown/CSV からの復元は実装しない。
- 既存workspaceへのマージ復元は実装しない。
- 添付ファイルは扱わない。
- バックアップをGitHubへ自動保存しない。

## 受け入れ条件

- JSON export が作成できる。
- JSON validate がエラーを具体表示できる。
- 新規workspaceへ復元できる。
- round-trip テストがある。
- Markdown/CSV は復元用ではないと明記される。
- 変更ファイル一覧、テスト結果、未対応事項を報告する。
