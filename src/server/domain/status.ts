import type { WorkItemRow, WorkItemType } from "@/server/types";

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
