import { and, desc, eq, isNull } from "drizzle-orm";
import { PERSONAL_WORKSPACE_ID } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { repositories, workItems } from "@/server/db/schema";
import type { WorkItemRow } from "@/server/types";
import { assertPersonalWorkspaceScope } from "./context";
import { toWorkItemRow } from "./mappers";

export async function listDashboardWorkItems(workspaceId = PERSONAL_WORKSPACE_ID): Promise<WorkItemRow[]> {
  assertPersonalWorkspaceScope(workspaceId);

  const rows = getDb()
    .select({
      item: workItems,
      repository: {
        name: repositories.name,
        productionStatus: repositories.productionStatus
      }
    })
    .from(workItems)
    .leftJoin(repositories, eq(workItems.repositoryId, repositories.id))
    .where(and(eq(workItems.workspaceId, workspaceId), isNull(workItems.deletedAt)))
    .orderBy(desc(workItems.updatedAt))
    .limit(100)
    .all();

  return rows.map((row) => toWorkItemRow(row.item, row.repository));
}
