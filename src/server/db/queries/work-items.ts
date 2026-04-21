import { and, desc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { repositories, statusHistories, workItems } from "@/server/db/schema";
import { applyStatusTimestamps, assertAllowedWorkItemStatus } from "@/server/domain/status";
import type { Priority, PrivacyLevel, SourceType, WorkItemRow, WorkItemScope, WorkItemType } from "@/server/types";
import { assertPersonalWorkspaceScope } from "./context";
import { toWorkItemRow } from "./mappers";
import { assertActiveRepositoryInWorkspace } from "./repositories";

type CreateWorkItemInput = {
  workspaceId: string;
  userId: string;
  repositoryId: string | null;
  scope: WorkItemScope;
  type: WorkItemType;
  title: string;
  body?: string | null;
  status: string;
  priority: Priority;
  sourceType: SourceType;
  sourceRef?: string | null;
  privacyLevel: PrivacyLevel;
  isPinned: boolean;
  externalUrl?: string | null;
  externalProvider?: "github" | null;
};

export async function createWorkItemCommand(input: CreateWorkItemInput) {
  assertPersonalWorkspaceScope(input.workspaceId);
  assertAllowedWorkItemStatus(input.type, input.status);
  assertActiveRepositoryInWorkspace(input.workspaceId, input.repositoryId);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  getDb()
    .insert(workItems)
    .values({
      id,
      workspaceId: input.workspaceId,
      userId: input.userId,
      repositoryId: input.repositoryId,
      scope: input.scope,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      status: input.status,
      priority: input.priority,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef ?? null,
      privacyLevel: input.privacyLevel,
      isPinned: input.isPinned,
      externalUrl: input.externalUrl ?? null,
      externalProvider: input.externalProvider ?? null,
      createdAt: now,
      updatedAt: now
    })
    .run();

  return id;
}

export async function updateWorkItemStatusCommand(workspaceId: string, userId: string, id: string, status: string) {
  assertPersonalWorkspaceScope(workspaceId);

  getDb().transaction((tx) => {
    const item = tx
      .select()
      .from(workItems)
      .where(
        and(eq(workItems.workspaceId, workspaceId), eq(workItems.id, id), isNull(workItems.archivedAt), isNull(workItems.deletedAt))
      )
      .get();

    if (!item) {
      throw new Error(`Work item not found: ${id}`);
    }

    const row = toWorkItemRow(item);
    const now = new Date().toISOString();

    assertAllowedWorkItemStatus(row.type, status);
    const timestamps = applyStatusTimestamps(row, status, now);

    const result = tx
      .update(workItems)
      .set({
        status,
        completedAt: timestamps.completed_at,
        closedAt: timestamps.closed_at,
        statusChangedAt: timestamps.status_changed_at,
        updatedAt: now
      })
      .where(
        and(
          eq(workItems.workspaceId, workspaceId),
          eq(workItems.id, id),
          eq(workItems.status, item.status),
          isNull(workItems.archivedAt),
          isNull(workItems.deletedAt)
        )
      )
      .run();

    if (result.changes !== 1) {
      throw new Error(`Failed to update work item status: ${id}`);
    }

    tx.insert(statusHistories)
      .values({
        id: crypto.randomUUID(),
        workspaceId,
        userId,
        workItemId: id,
        fromStatus: item.status,
        toStatus: status,
        createdAt: now
      })
      .run();
  });
}

export async function listWorkItems(workspaceId: string): Promise<WorkItemRow[]> {
  assertPersonalWorkspaceScope(workspaceId);
  return selectWorkItems(workspaceId);
}

export async function listWorkItemsByTypes(workspaceId: string, types: WorkItemType[]): Promise<WorkItemRow[]> {
  assertPersonalWorkspaceScope(workspaceId);
  return selectWorkItems(workspaceId, inArray(workItems.type, types));
}

export async function listMemoWorkItems(workspaceId: string): Promise<WorkItemRow[]> {
  assertPersonalWorkspaceScope(workspaceId);
  return selectWorkItems(workspaceId, eq(workItems.type, "memo"), eq(workItems.status, "unreviewed"));
}

export async function listAllMemoWorkItems(workspaceId: string): Promise<WorkItemRow[]> {
  assertPersonalWorkspaceScope(workspaceId);
  return selectWorkItems(workspaceId, eq(workItems.type, "memo"));
}

export async function listWorkItemsForRepository(workspaceId: string, repositoryId: string): Promise<WorkItemRow[]> {
  assertPersonalWorkspaceScope(workspaceId);
  return selectWorkItems(workspaceId, eq(workItems.repositoryId, repositoryId));
}

export async function getWorkItemById(workspaceId: string, id: string): Promise<WorkItemRow | null> {
  assertPersonalWorkspaceScope(workspaceId);

  const row = getDb()
    .select({
      item: workItems,
      repository: {
        name: repositories.name,
        productionStatus: repositories.productionStatus
      }
    })
    .from(workItems)
    .leftJoin(repositories, eq(workItems.repositoryId, repositories.id))
    .where(
      and(eq(workItems.workspaceId, workspaceId), eq(workItems.id, id), isNull(workItems.archivedAt), isNull(workItems.deletedAt))
    )
    .get();

  return row ? toWorkItemRow(row.item, row.repository) : null;
}

function selectWorkItems(workspaceId: string, ...extraConditions: SQL[]) {
  const conditions = [eq(workItems.workspaceId, workspaceId), isNull(workItems.archivedAt), isNull(workItems.deletedAt)];
  conditions.push(...extraConditions);

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
    .where(and(...conditions))
    .orderBy(desc(workItems.updatedAt))
    .all();

  return rows.map((row) => toWorkItemRow(row.item, row.repository));
}
