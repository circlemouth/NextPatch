import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { repositories, statusHistories, workItems } from "@/server/db/schema";
import { applyStatusTimestamps } from "@/server/domain/status";
import type { Priority, PrivacyLevel, SourceType, WorkItemRow, WorkItemScope, WorkItemType } from "@/server/types";
import { assertPersonalWorkspaceScope } from "./context";
import { toWorkItemRow } from "./mappers";

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
      .where(and(eq(workItems.workspaceId, workspaceId), eq(workItems.id, id)))
      .get();

    if (!item) {
      throw new Error(`Work item not found: ${id}`);
    }

    const row = toWorkItemRow(item);
    const now = new Date().toISOString();
    const timestamps = applyStatusTimestamps(row, status, now);

    tx.update(workItems)
      .set({
        status,
        completedAt: timestamps.completed_at,
        closedAt: timestamps.closed_at,
        statusChangedAt: timestamps.status_changed_at,
        updatedAt: now
      })
      .where(and(eq(workItems.workspaceId, workspaceId), eq(workItems.id, id)))
      .run();

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
    .where(and(eq(workItems.workspaceId, workspaceId), eq(workItems.id, id)))
    .get();

  return row ? toWorkItemRow(row.item, row.repository) : null;
}

function selectWorkItems(workspaceId: string, extraCondition?: ReturnType<typeof eq> | ReturnType<typeof inArray>) {
  const conditions = [eq(workItems.workspaceId, workspaceId), isNull(workItems.deletedAt)];
  if (extraCondition) {
    conditions.push(extraCondition);
  }

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
