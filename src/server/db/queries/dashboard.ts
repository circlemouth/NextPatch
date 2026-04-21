import { toDashboardItem } from "@/server/domain/dashboard";
import type { QueryContext } from "@/server/db/queries/context";
import { listWorkItems } from "@/server/db/queries/work-items";

export function getDashboardForDatabase(ctx: QueryContext) {
  const items = listWorkItems(ctx).map(toDashboardItem).filter((item) => item.tier < 99);

  return {
    now: [...items].sort((a, b) => a.tier - b.tier).slice(0, 10),
    criticalBugs: items.filter((item) => item.reasons.includes("実稼働重大バグ")).slice(0, 5),
    inbox: items.filter((item) => item.type === "memo" && item.status === "unreviewed").slice(0, 5),
    recentCompleted: listWorkItems(ctx)
      .filter((item) => item.completed_at)
      .map(toDashboardItem)
      .slice(0, 10)
  };
}

