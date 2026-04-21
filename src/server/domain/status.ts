import type { WorkItemRow, WorkItemType } from "@/server/types";

export type WorkItemStatusAction = {
  status: string;
  label: string;
  style: "secondary" | "tertiary";
};

const completedStatuses: Record<WorkItemType, string[]> = {
  task: ["done"],
  bug: ["resolved"],
  idea: ["promoted", "adopted"],
  implementation: ["done"],
  future_feature: ["adopted", "promoted"],
  memo: ["itemized", "record_only"]
};

const closedOnlyStatuses: Record<WorkItemType, string[]> = {
  task: ["canceled", "duplicate"],
  bug: ["cannot_reproduce", "works_as_designed", "not_planned", "duplicate"],
  idea: ["rejected", "duplicate"],
  implementation: ["canceled", "duplicate"],
  future_feature: ["rejected", "duplicate"],
  memo: ["discarded", "duplicate"]
};

const holdStatuses = new Set(["on_hold", "blocked"]);

const allowedStatuses: Record<WorkItemType, readonly string[]> = {
  task: ["todo", "doing", "blocked", "on_hold", "done", "canceled", "duplicate"],
  bug: [
    "unconfirmed",
    "confirmed",
    "doing",
    "fixed_waiting",
    "resolved",
    "blocked",
    "on_hold",
    "cannot_reproduce",
    "works_as_designed",
    "not_planned",
    "canceled",
    "duplicate"
  ],
  idea: ["unreviewed", "in_review", "accepted", "promoted", "adopted", "rejected", "blocked", "on_hold", "duplicate"],
  implementation: ["todo", "doing", "blocked", "on_hold", "done", "canceled", "duplicate"],
  future_feature: ["todo", "doing", "blocked", "on_hold", "adopted", "promoted", "rejected", "canceled", "duplicate"],
  memo: ["unreviewed", "itemized", "record_only", "discarded", "duplicate"]
};

const statusActions: Record<WorkItemType, Partial<Record<string, readonly WorkItemStatusAction[]>>> = {
  task: {
    todo: [{ status: "doing", label: "着手", style: "secondary" }],
    doing: [{ status: "done", label: "完了", style: "secondary" }],
    blocked: [{ status: "doing", label: "再開", style: "secondary" }],
    on_hold: [{ status: "doing", label: "再開", style: "secondary" }],
    done: [{ status: "todo", label: "再オープン", style: "tertiary" }],
    canceled: [{ status: "todo", label: "再オープン", style: "tertiary" }],
    duplicate: [{ status: "todo", label: "再オープン", style: "tertiary" }]
  },
  bug: {
    unconfirmed: [{ status: "confirmed", label: "確認済みにする", style: "secondary" }],
    confirmed: [
      { status: "doing", label: "対応開始", style: "secondary" },
      { status: "fixed_waiting", label: "修正済み・確認待ち", style: "tertiary" }
    ],
    doing: [{ status: "fixed_waiting", label: "修正済み・確認待ち", style: "secondary" }],
    fixed_waiting: [{ status: "resolved", label: "解決済みにする", style: "secondary" }],
    resolved: [{ status: "confirmed", label: "再オープン", style: "tertiary" }],
    blocked: [{ status: "doing", label: "再開", style: "secondary" }],
    on_hold: [{ status: "doing", label: "再開", style: "secondary" }],
    cannot_reproduce: [{ status: "confirmed", label: "再オープン", style: "tertiary" }],
    works_as_designed: [{ status: "confirmed", label: "再オープン", style: "tertiary" }],
    not_planned: [{ status: "confirmed", label: "再オープン", style: "tertiary" }],
    canceled: [{ status: "confirmed", label: "再オープン", style: "tertiary" }],
    duplicate: [{ status: "confirmed", label: "再オープン", style: "tertiary" }]
  },
  idea: {
    unreviewed: [{ status: "in_review", label: "レビュー開始", style: "secondary" }],
    in_review: [
      { status: "accepted", label: "採用", style: "secondary" },
      { status: "rejected", label: "却下", style: "tertiary" }
    ],
    accepted: [{ status: "promoted", label: "昇格", style: "secondary" }],
    adopted: [{ status: "promoted", label: "昇格", style: "secondary" }],
    rejected: [{ status: "in_review", label: "再レビュー", style: "tertiary" }],
    blocked: [{ status: "in_review", label: "再開", style: "secondary" }],
    on_hold: [{ status: "in_review", label: "再開", style: "secondary" }],
    duplicate: [{ status: "in_review", label: "再レビュー", style: "tertiary" }]
  },
  implementation: {
    todo: [{ status: "doing", label: "着手", style: "secondary" }],
    doing: [{ status: "done", label: "完了", style: "secondary" }],
    blocked: [{ status: "doing", label: "再開", style: "secondary" }],
    on_hold: [{ status: "doing", label: "再開", style: "secondary" }],
    done: [{ status: "todo", label: "再オープン", style: "tertiary" }],
    canceled: [{ status: "todo", label: "再オープン", style: "tertiary" }],
    duplicate: [{ status: "todo", label: "再オープン", style: "tertiary" }]
  },
  future_feature: {
    todo: [
      { status: "adopted", label: "採用", style: "secondary" },
      { status: "rejected", label: "却下", style: "tertiary" }
    ],
    doing: [
      { status: "adopted", label: "採用", style: "secondary" },
      { status: "rejected", label: "却下", style: "tertiary" }
    ],
    blocked: [{ status: "doing", label: "再開", style: "secondary" }],
    on_hold: [{ status: "doing", label: "再開", style: "secondary" }],
    adopted: [{ status: "promoted", label: "昇格", style: "secondary" }],
    rejected: [{ status: "todo", label: "再検討", style: "tertiary" }],
    canceled: [{ status: "todo", label: "再オープン", style: "tertiary" }],
    duplicate: [{ status: "todo", label: "再オープン", style: "tertiary" }]
  },
  memo: {}
};

export function isCompleted(type: WorkItemType, status: string) {
  return completedStatuses[type].includes(status);
}

export function isClosed(type: WorkItemType, status: string) {
  return isCompleted(type, status) || closedOnlyStatuses[type].includes(status);
}

export function isOpen(item: Pick<WorkItemRow, "type" | "status" | "archived_at" | "deleted_at">) {
  return !item.archived_at && !item.deleted_at && !isClosed(item.type, item.status);
}

export function isOnHold(status: string) {
  return holdStatuses.has(status);
}

export function isAllowedWorkItemStatus(type: WorkItemType, status: string) {
  return allowedStatuses[type].includes(status);
}

export function assertAllowedWorkItemStatus(type: WorkItemType, status: string) {
  if (!isAllowedWorkItemStatus(type, status)) {
    throw new Error(`Unsupported status for ${type}: ${status}`);
  }
}

export function getWorkItemStatusActions(item: Pick<WorkItemRow, "type" | "status">) {
  return (statusActions[item.type][item.status] ?? []).filter((action) => isAllowedWorkItemStatus(item.type, action.status));
}

export function applyStatusTimestamps(
  item: Pick<WorkItemRow, "type" | "status" | "completed_at" | "closed_at">,
  nextStatus: string,
  now = new Date().toISOString()
) {
  const nextCompleted = isCompleted(item.type, nextStatus);
  const nextClosed = isClosed(item.type, nextStatus);
  const currentCompleted = isCompleted(item.type, item.status);
  const currentClosed = isClosed(item.type, item.status);

  return {
    completed_at:
      nextCompleted && !item.completed_at
        ? now
        : currentCompleted && !nextCompleted
          ? null
          : item.completed_at,
    closed_at:
      nextClosed && !item.closed_at ? now : currentClosed && !nextClosed ? null : item.closed_at,
    status_changed_at: now
  };
}
