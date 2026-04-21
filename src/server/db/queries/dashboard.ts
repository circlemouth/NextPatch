import { getSqliteDb } from "../client";
import { PERSONAL_WORKSPACE_ID } from "../schema";
import type { ProductionStatus, WorkItemRow } from "@/server/types";

type DashboardRow = Omit<WorkItemRow, "is_pinned" | "repositories"> & {
  is_pinned: number | boolean;
  repository_name: string | null;
  repository_production_status: ProductionStatus | null;
};

export function listDashboardWorkItems(workspaceId = PERSONAL_WORKSPACE_ID): WorkItemRow[] {
  const rows = getSqliteDb()
    .prepare(
      `select
        work_items.*,
        repositories.name as repository_name,
        repositories.production_status as repository_production_status
       from work_items
       left join repositories
        on repositories.id = work_items.repository_id
        and repositories.workspace_id = work_items.workspace_id
       where work_items.workspace_id = ?
        and work_items.deleted_at is null
       order by work_items.updated_at desc
       limit 100`
    )
    .all(workspaceId) as DashboardRow[];

  return rows.map(({ repository_name, repository_production_status, ...item }) => ({
    ...item,
    is_pinned: Boolean(item.is_pinned),
    repositories: repository_name
      ? {
          name: repository_name,
          production_status: repository_production_status ?? "development"
        }
      : null
  }));
}
