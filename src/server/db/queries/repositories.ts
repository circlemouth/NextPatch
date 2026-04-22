import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { repositories, workItems } from "@/server/db/schema";
import type { RepositoryRow, RepositorySummaryRow } from "@/server/types";
import { assertPersonalWorkspaceScope } from "./context";
import { toRepositoryRow } from "./mappers";

type CreateRepositoryInput = {
  workspaceId: string;
  userId: string;
  provider: "manual" | "github";
  name: string;
  description?: string | null;
  htmlUrl?: string | null;
  githubHost?: string | null;
  githubOwner?: string | null;
  githubRepo?: string | null;
  githubFullName?: string | null;
  productionStatus: RepositoryRow["production_status"];
  criticality: RepositoryRow["criticality"];
  currentFocus?: string | null;
};

export async function createRepositoryCommand(input: CreateRepositoryInput) {
  assertPersonalWorkspaceScope(input.workspaceId);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  getDb()
    .insert(repositories)
    .values({
      id,
      workspaceId: input.workspaceId,
      userId: input.userId,
      provider: input.provider,
      name: input.name,
      description: input.description ?? null,
      htmlUrl: input.htmlUrl ?? null,
      githubHost: input.githubHost ?? null,
      githubOwner: input.githubOwner ?? null,
      githubRepo: input.githubRepo ?? null,
      githubFullName: input.githubFullName ?? null,
      productionStatus: input.productionStatus,
      criticality: input.criticality,
      currentFocus: input.currentFocus ?? null,
      createdAt: now,
      updatedAt: now
    })
    .run();

  return id;
}

export async function updateRepositoryFocusCommand(workspaceId: string, id: string, currentFocus: string | null) {
  assertPersonalWorkspaceScope(workspaceId);

  const now = new Date().toISOString();
  const result = getDb()
    .update(repositories)
    .set({ currentFocus, updatedAt: now })
    .where(
      and(eq(repositories.workspaceId, workspaceId), eq(repositories.id, id), isNull(repositories.archivedAt), isNull(repositories.deletedAt))
    )
    .run();

  if (result.changes !== 1) {
    throw new Error(`Repository not found: ${id}`);
  }
}

export async function archiveRepositoryCommand(workspaceId: string, id: string) {
  assertPersonalWorkspaceScope(workspaceId);

  const now = new Date().toISOString();
  getDb()
    .update(repositories)
    .set({ archivedAt: now, updatedAt: now })
    .where(and(eq(repositories.workspaceId, workspaceId), eq(repositories.id, id)))
    .run();
}

export async function listRepositories(workspaceId: string): Promise<RepositoryRow[]> {
  assertPersonalWorkspaceScope(workspaceId);

  const rows = getDb()
    .select()
    .from(repositories)
    .where(and(eq(repositories.workspaceId, workspaceId), isNull(repositories.archivedAt), isNull(repositories.deletedAt)))
    .orderBy(desc(repositories.updatedAt))
    .all();

  return rows.map(toRepositoryRow);
}

export async function listRepositorySummaries(workspaceId: string): Promise<RepositorySummaryRow[]> {
  assertPersonalWorkspaceScope(workspaceId);

  const lastActivityExpression = sql<string>`max(${repositories.updatedAt}, coalesce(max(${workItems.updatedAt}), ${repositories.updatedAt}))`;
  const rows = getDb()
    .select({
      repository: repositories,
      openItemCount: sql<number>`coalesce(sum(case
        when ${workItems.id} is null then 0
        when (
          (${workItems.type} = 'task' and ${workItems.status} in ('done', 'canceled', 'duplicate')) or
          (${workItems.type} = 'bug' and ${workItems.status} in (
            'resolved',
            'cannot_reproduce',
            'works_as_designed',
            'not_planned',
            'canceled',
            'duplicate'
          )) or
          (${workItems.type} = 'idea' and ${workItems.status} in ('promoted', 'adopted', 'rejected', 'duplicate')) or
          (${workItems.type} = 'implementation' and ${workItems.status} in ('done', 'canceled', 'duplicate')) or
          (${workItems.type} = 'future_feature' and ${workItems.status} in (
            'adopted',
            'promoted',
            'rejected',
            'canceled',
            'duplicate'
          )) or
          (${workItems.type} = 'memo' and ${workItems.status} in ('itemized', 'record_only', 'discarded', 'duplicate'))
        ) then 0
        else 1
      end), 0)`,
      memoCount: sql<number>`coalesce(sum(case when ${workItems.type} = 'memo' then 1 else 0 end), 0)`,
      lastActivityAt: lastActivityExpression
    })
    .from(repositories)
    .leftJoin(
      workItems,
      and(
        eq(workItems.workspaceId, workspaceId),
        eq(workItems.repositoryId, repositories.id),
        isNull(workItems.archivedAt),
        isNull(workItems.deletedAt)
      )
    )
    .where(and(eq(repositories.workspaceId, workspaceId), isNull(repositories.archivedAt), isNull(repositories.deletedAt)))
    .groupBy(repositories.id)
    .orderBy(desc(lastActivityExpression))
    .all();

  return rows.map((row) => {
    return {
      ...toRepositoryRow(row.repository),
      open_item_count: Number(row.openItemCount),
      memo_count: Number(row.memoCount),
      last_activity_at: row.lastActivityAt
    };
  });
}

export async function getRepositoryById(workspaceId: string, id: string): Promise<RepositoryRow | null> {
  assertPersonalWorkspaceScope(workspaceId);

  const row = getDb()
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.workspaceId, workspaceId),
        eq(repositories.id, id),
        isNull(repositories.archivedAt),
        isNull(repositories.deletedAt)
      )
    )
    .get();

  return row ? toRepositoryRow(row) : null;
}

export function assertActiveRepositoryInWorkspace(workspaceId: string, repositoryId: string | null) {
  if (!repositoryId) {
    return;
  }

  const row = getDb()
    .select({ id: repositories.id })
    .from(repositories)
    .where(
      and(
        eq(repositories.workspaceId, workspaceId),
        eq(repositories.id, repositoryId),
        isNull(repositories.archivedAt),
        isNull(repositories.deletedAt)
      )
    )
    .get();

  if (!row) {
    throw new Error(`Active repository not found in workspace: ${repositoryId}`);
  }
}
