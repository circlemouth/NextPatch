export function formatWorkItemType(type: string) {
  const labels: Record<string, string> = {
    memo: "メモ",
    task: "タスク",
    bug: "バグ",
    idea: "アイデア",
    implementation: "実装メモ",
    future_feature: "将来機能"
  };

  return labels[type] ?? type;
}

export function formatWorkItemStatus(status: string) {
  const labels: Record<string, string> = {
    unreviewed: "未確認",
    in_review: "レビュー中",
    accepted: "採用候補",
    promoted: "昇格済み",
    adopted: "採用済み",
    rejected: "却下",
    todo: "未着手",
    doing: "進行中",
    blocked: "ブロック中",
    on_hold: "保留",
    done: "完了",
    canceled: "キャンセル",
    duplicate: "重複",
    unconfirmed: "未確認",
    confirmed: "確認済み",
    fixed_waiting: "修正済み・確認待ち",
    resolved: "解決済み",
    cannot_reproduce: "再現不可",
    works_as_designed: "仕様通り",
    not_planned: "対応予定なし",
    itemized: "項目化済み",
    record_only: "記録のみ",
    discarded: "破棄"
  };

  return labels[status] ?? status;
}

export function formatWorkItemScope(scope: string) {
  const labels: Record<string, string> = {
    repository: "リポジトリ",
    inbox: "受信箱",
    global: "全体"
  };

  return labels[scope] ?? scope;
}
