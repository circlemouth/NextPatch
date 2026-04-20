# サブエージェント05: クイック登録・未整理メモ分類

あなたは Quick Capture、未整理メモ、ChatGPT貼り付け、JSON/Markdown parser、分類候補適用を担当します。
必ず個別 worktree で作業してください。

```bash
git worktree add ../nextpatch-capture -b feature/quick-capture-triage
cd ../nextpatch-capture
```

## 参照ドキュメント

- `docs/04_INFORMATION_ARCHITECTURE.md`
- `docs/05_SCREEN_BLUEPRINTS.md`
- `docs/11_GITHUB_CHATGPT_ROADMAP.md`
- `templates/nextpatch.import.v1.schema.json`

## 作業内容

1. `/capture/new` 画面を実装する。
2. repo任意、type任意、本文必須で保存できるようにする。
3. 未選択なら type=memo / scope=inbox として保存する。
4. ChatGPT貼り付け用サポートテキストと注意文を表示する。
5. `nextpatch.import.v1` JSON parser を実装する。
6. Markdown補助 parser を実装する。
7. classification_candidates を作成する。
8. `/inbox` と分類適用 UI を実装する。
9. 分類適用時に元メモを保持し、関連を残す。

## 制約

- OpenAI API は呼ばない。
- AI自動分類は実装しない。
- JSON解析失敗でも原文保存する。
- 重要な分類操作をメニュー奥に隠さない。

## 受け入れ条件

- スマホで3操作以内にメモ保存できる。
- repositoryIdなしで保存できる。
- valid JSON から候補が作られる。
- invalid JSON でも raw memo が保存される。
- 候補から task/bug/idea 等を作成できる。
- 変更ファイル一覧、テスト結果、未対応事項を報告する。
