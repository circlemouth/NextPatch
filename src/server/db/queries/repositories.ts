import { randomUUID } from "node:crypto";
import { getDb } from "@/server/db/client";
import { mapRepository, mapWorkItem } from "@/server/db/queries/mappers";
import type { Criticality, ProductionStatus, RepositoryRow, WorkItemRow } from "@/server/types";

export type CreateRepositoryInput = {
  workspaceId: string;
  userId: string;
  provider: RepositoryRow["provider"];
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

export async function listRepositories(workspaceId: string) {
  const rows = getDb()
    .prepare(
      `
        select *
        from repositories
        where workspace_id = ? and deleted_at is null
        order by updated_at desc
      `
    )
    .all(workspaceId) as RepositoryRow[];

  return rows.map(mapRepository);
}

export async function getRepositoryDetail(workspaceId: string, repositoryId: string) {
  const db = getDb();
  const repository = db
    .prepare("select * from repositories where workspace_id = ? and id = ? and deleted_at is null")
    .get(workspaceId, repositoryId) as RepositoryRow | undefined;

  if (!repository) {
    throw new Error("Repository not found.");
  }

  const items = db
    .prepare(
      `
        select wi.*, r.name as repository_name, r.production_status as repository_production_status
        from work_items wi
        left join repositories r on r.id = wi.repository_id
        where wi.workspace_id = ? and wi.repository_id = ? and wi.deleted_at is null
        order by wi.updated_at desc
      `
    )
    .all(workspaceId, repositoryId) as WorkItemRow[];

  return {
    repository: mapRepository(repository),
    items: items.map(mapWorkItem)
  };
}

export async function createRepositoryRecord(input: CreateRepositoryInput) {
  const id = randomUUID();
  const now = new Date().toISOString();

  getDb()
    .prepare(
      `
        insert into repositories (
          id, workspace_id, user_id, provider, name, description, html_url,
          github_host, github_owner, github_repo, github_full_name,
          production_status, criticality, current_focus, created_at, updated_at
        )
        values (
          @id, @workspaceId, @userId, @provider, @name, @description, @htmlUrl,
          @githubHost, @githubOwner, @githubRepo, @githubFullName,
          @productionStatus, @criticality, @currentFocus, @now, @now
        )
      `
    )
    .run({
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
      now
    });

  return id;
}

export async function archiveRepositoryRecord(workspaceId: string, repositoryId: string) {
  getDb()
    .prepare(
      `
        update repositories
        set archived_at = @now, updated_at = @now
        where workspace_id = @workspaceId and id = @repositoryId
      `
    )
    .run({
      now: new Date().toISOString(),
      workspaceId,
      repositoryId
    });
}
