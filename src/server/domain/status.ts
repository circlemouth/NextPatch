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
