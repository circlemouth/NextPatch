import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { repositories, workItems } from "@/server/db/schema";
import { isOpen } from "@/server/domain/status";
import type { RepositoryRow, RepositorySummaryRow } from "@/server/types";
import { assertPersonalWorkspaceScope } from "./context";
import { toRepositoryRow, toWorkItemRow } from "./mappers";

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

  const repositoryRows = getDb()
    .select()
    .from(repositories)
    .where(and(eq(repositories.workspaceId, workspaceId), isNull(repositories.archivedAt), isNull(repositories.deletedAt)))
    .orderBy(desc(repositories.updatedAt))
    .all();
  const workItemRows = getDb()
    .select()
    .from(workItems)
    .where(and(eq(workItems.workspaceId, workspaceId), isNull(workItems.archivedAt), isNull(workItems.deletedAt)))
    .all();

  const counts = new Map<string, { openItemCount: number; memoCount: number; lastActivityAt: string | null }>();

  for (const itemRow of workItemRows) {
    const item = toWorkItemRow(itemRow);

    if (!item.repository_id) {
      continue;
    }

    const entry = counts.get(item.repository_id) ?? {
      openItemCount: 0,
      memoCount: 0,
      lastActivityAt: null
    };

    if (isOpen(item)) {
      entry.openItemCount += 1;
    }

    if (item.type === "memo") {
      entry.memoCount += 1;
    }

    entry.lastActivityAt = latestIso(entry.lastActivityAt, item.updated_at);
    counts.set(item.repository_id, entry);
  }

  return repositoryRows.map((repository) => {
    const summary = counts.get(repository.id);
    return {
      ...toRepositoryRow(repository),
      open_item_count: summary?.openItemCount ?? 0,
      memo_count: summary?.memoCount ?? 0,
      last_activity_at: latestIso(repository.updatedAt, summary?.lastActivityAt ?? null)
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

function latestIso(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
