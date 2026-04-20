# サブエージェント08: QA・テスト・リリース前調整

あなたは NextPatch MVP のテスト、E2E、リリース前チェック、README整備を担当します。
必ず個別 worktree で作業してください。

```bash
git worktree add ../nextpatch-qa -b feature/test-release-qa
cd ../nextpatch-qa
```

## 参照ドキュメント

- `docs/14_TEST_PLAN.md`
- `docs/19_IMPLEMENTATION_PLAN.md`
- `docs/20_TASK_BREAKDOWN.md`
- `docs/13_TECH_ARCHITECTURE_LOCAL_SERVER.md`

## 作業内容

1. 単体テストの不足を確認する。
2. 結合テストの不足を確認する。
3. 主要E2E 12本を実装または整理する。
4. axe / accessibility テストを追加する。
5. viewport テストを追加する。
6. export/import round-trip テストを追加する。
7. IDOR/RLS テストを確認する。
8. README のローカル起動、停止、backup、restore、SMTP、外部公開注意を整える。
9. release checklist を作成する。

## 制約

- テストのために認証なしモードを標準化しない。
- seed data に secret を含めない。
- flaky な E2E を増やしすぎない。ロジックは単体/結合へ寄せる。

## 受け入れ条件

- 主要E2Eが通る。
- export/import round-tripが通る。
- a11y重大違反がない。
- README手順で新規環境を起動できる。
- 変更ファイル一覧、テスト結果、未対応事項を報告する。
