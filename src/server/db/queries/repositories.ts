import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { repositories } from "@/server/db/schema";
import type { Criticality, ProductionStatus, RepositoryRow } from "@/server/types";
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
  productionStatus: ProductionStatus;
  criticality: Criticality;
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
