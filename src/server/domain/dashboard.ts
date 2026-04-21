import { requireLocalContext } from "@/server/auth/session";
import { listWorkItems } from "@/server/db/queries/work-items";
import { isClosed, isOnHold } from "@/server/domain/status";
import type { WorkItemRow } from "@/server/types";

export type DashboardItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  repositoryName: string | null;
  reasons: string[];
  tier: number;
};

export async function getDashboard() {
  const { workspace } = await requireLocalContext();
  const data = await listWorkItems(workspace.id);
  const items = data.slice(0, 100).map(toDashboardItem).filter((item) => item.tier < 99);
  const now = [...items].sort((a: DashboardItem, b: DashboardItem) => a.tier - b.tier).slice(0, 10);
  const criticalBugs = items.filter((item) => item.reasons.includes("実稼働重大バグ")).slice(0, 5);
  const inbox = items.filter((item) => item.type === "memo" && item.status === "unreviewed").slice(0, 5);
  const recentCompleted = data
    .filter((item) => item.completed_at && isRecent(item.completed_at))
    .slice(0, 10)
    .map(toDashboardItem);

  return {
    now,
    criticalBugs,
    inbox,
    recentCompleted
  };
}

export function toDashboardItem(item: WorkItemRow): DashboardItem {
  const reasons: string[] = [];
  let tier = 5;
  const repository = Array.isArray(item.repositories) ? item.repositories[0] : item.repositories;
  const production = repository?.production_status === "active_production";

  if (item.archived_at || item.deleted_at || isClosed(item.type, item.status) || isOnHold(item.status)) {
    tier = 99;
  } else if (item.is_pinned) {
    tier = 0;
    reasons.push("手動固定");
  } else if (production && item.type === "bug" && ["p0", "p1"].includes(item.priority)) {
    tier = 1;
    reasons.push("実稼働重大バグ");
  } else if (item.priority === "p0") {
    tier = 1;
    reasons.push("P0");
  } else if (["p0", "p1"].includes(item.priority) && item.target_version_id) {
    tier = 2;
    reasons.push("次バージョン対象");
  } else if (item.due_at && daysUntil(item.due_at) <= 3) {
    tier = 3;
    reasons.push("期限近い");
  } else if (["review_waiting", "reproduction_waiting", "fixed_waiting"].includes(item.status)) {
    tier = 3;
    reasons.push("確認待ち");
  } else if (["memo", "idea", "task"].includes(item.type) && item.status === "unreviewed" && daysSince(item.created_at) >= 3) {
    tier = 4;
    reasons.push("未整理3日以上");
  }

  return {
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.status,
    priority: item.priority,
    repositoryName: repository?.name ?? null,
    reasons,
    tier
  };
}

function daysUntil(isoDate: string) {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000);
}

function daysSince(isoDate: string) {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

function isRecent(isoDate: string) {
  return daysSince(isoDate) <= 7;
}
