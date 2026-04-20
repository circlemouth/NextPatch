# GitHub連携・ChatGPT連携ロードマップ

# 1. GitHub連携ロードマップ

## MVP採用レベル

MVPでは **Level 1: URL解析** まで採用する。OAuth、GitHub App、API取得、token保存は入れない。

| Level | 内容 | 採用時期 |
|---:|---|---|
| 0 | GitHub URL を文字列保存 | 最低限 |
| 1 | URL解析、owner/repo抽出、Issue/PR URLの手動リンク | MVP |
| 2 | read-only API 取得 | P1 |
| 3 | NextPatch から GitHub Issue 作成 | P2 |
| 4 | Issue/PR 双方向同期、webhook、競合解決 | P2/P3 |
| 5 | GitHub Projects / Release / Milestone 連携 | P3 |

## URL解析仕様

対応する入力例:

```text
https://github.com/owner/repo
https://github.com/owner/repo/
https://github.com/owner/repo.git
https://github.com/owner/repo/issues/123
https://github.com/owner/repo/pull/45
https://github.com/owner/repo/releases/tag/v1.0.0
```

保存する値:

| 値 | 用途 |
|---|---|
| raw_url | 入力値の保持 |
| canonical_url | 正規表示 |
| github_host | GitHub Enterprise 将来対応 |
| github_owner | API path 準備 |
| github_repo | API path 準備 |
| github_full_name | 表示/重複判定 |
| external_url | Issue/PR等のリンク |

## 後回しにする理由

- OAuth scope と token 保存が必要。
- private repo 対応で漏えいリスクが上がる。
- Issue と NextPatch WorkItem の意味が一致しない。
- webhook、rate limit、競合解決が必要になる。
- GitHub Projects の再実装になる危険がある。

# 2. ChatGPT連携ロードマップ

## MVPの手動貼り付け方式

- クイック登録に ChatGPT 回答を貼り付ける。
- 原文は必ず未整理メモとして保存する。
- JSON/Markdown が含まれる場合だけローカル parser が候補を作る。
- 候補は自動登録しない。

## 未整理メモ運用

| フィールド | 内容 |
|---|---|
| raw_content | 貼り付け原文 |
| source_type | manual_paste / chatgpt_paste / import_file_future |
| format_detected | json / markdown / plain_text / mixed / invalid_json |
| schema_version | nextpatch.import.v1 等 |
| status | unreviewed / parsed / reviewing / applied / archived |
| privacy_level | normal / confidential / secret / no_ai |
| ai_processing_allowed | 将来AI送信可否 |
| parse_errors | JSON不正等 |

## 将来のAI分類

- ユーザーの明示操作のみ。
- 送信前プレビュー必須。
- `no_ai` は送信不可。
- AI出力は候補であり、自動登録しない。
- JSON schema は `nextpatch.import.v1` と互換にする。

## 誤分類対策

- 原文保存を必須にする。
- 候補ごとに根拠引用を表示。
- confidence low は初期チェックを外す。
- 登録前に分類先・タイトル・本文を編集可能にする。
- 分類後も元メモへ戻れる。

## ChatGPT標準プロンプト

```text
ここまでの会話内容を、開発管理アプリ NextPatch に貼り付けるために整理してください。

目的:
- 開発中アプリまたはGitHubリポジトリの管理
- 課題、バグ、実装予定、将来構想、技術候補、参考サービス、未整理メモを分類
- NextPatchの取り込み用 JSON を出力

制約:
- 機密情報、APIキー、トークン、個人情報は含めない
- 不確かな内容は confidence を low にする
- 自動実行ではなく、ユーザー確認前提の候補として出す

出力形式:
1. 人間向け Summary
2. 次の JSON ブロック

JSON schema:
{
  "schema_version": "nextpatch.import.v1",
  "source": {
    "tool": "ChatGPT",
    "conversation_title": "",
    "captured_at": "YYYY-MM-DD",
    "privacy_note": "機密情報は含めていない"
  },
  "repository_hint": {
    "owner": "",
    "name": "",
    "branch": "",
    "area": ""
  },
  "summary": "",
  "items": [
    {
      "kind": "task | bug | idea | reference_service | tech_candidate | future_plan | note",
      "title": "",
      "body": "",
      "priority": "low | medium | high | urgent",
      "labels": [],
      "evidence": "",
      "confidence": "low | medium | high",
      "needs_review": true
    }
  ],
  "unclassified_notes": []
}
```
