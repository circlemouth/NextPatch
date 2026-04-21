import { randomUUID } from "node:crypto";

import { parseGitHubUrl } from "@/server/domain/github-url";
import type { QueryContext } from "@/server/db/queries/context";
import type { Criticality, ProductionStatus, RepositoryRow } from "@/server/types";

type RepositoryRecord = Omit<RepositoryRow, "is_favorite"> & {
  is_favorite: number;
};

export type CreateRepositoryInput = {
  name: string;
  htmlUrl?: string | null;
  description?: string | null;
  productionStatus?: ProductionStatus;
  criticality?: Criticality;
  currentFocus?: string | null;
};

export function createRepository(ctx: QueryContext, input: CreateRepositoryInput) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const github = input.htmlUrl ? parseGitHubUrl(input.htmlUrl) : null;

  ctx.db
    .prepare(
      `
        INSERT INTO repositories (
          id, workspace_id, user_id, provider, name, description, html_url,
          github_host, github_owner, github_repo, github_full_name,
          production_status, criticality, current_focus, is_favorite, sort_order,
          created_at, updated_at, archived_at, deleted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, NULL, NULL)
      `
    )
    .run(
      id,
      ctx.workspaceId,
      ctx.userId,
      github ? "github" : "manual",
      input.name,
      input.description ?? null,
      github?.canonicalUrl ?? input.htmlUrl ?? null,
      github?.githubHost ?? null,
      github?.githubOwner ?? null,
      github?.githubRepo ?? null,
      github?.githubFullName ?? null,
      input.productionStatus ?? "development",
      input.criticality ?? "medium",
      input.currentFocus ?? null,
      now,
      now
    );

  return getRepository(ctx, id);
}

export function getRepository(ctx: QueryContext, id: string) {
  const row = ctx.db
    .prepare("SELECT * FROM repositories WHERE workspace_id = ? AND id = ?")
    .get(ctx.workspaceId, id) as RepositoryRecord | undefined;

  if (!row) {
    throw new Error(`Repository not found: ${id}`);
  }

  return toRepositoryRow(row);
}

export function listRepositories(ctx: QueryContext, options: { includeArchived?: boolean } = {}) {
  const rows = ctx.db
    .prepare(
      `
        SELECT * FROM repositories
        WHERE workspace_id = ?
          AND deleted_at IS NULL
          AND (? OR archived_at IS NULL)
        ORDER BY created_at ASC
      `
    )
    .all(ctx.workspaceId, options.includeArchived ? 1 : 0) as RepositoryRecord[];

  return rows.map(toRepositoryRow);
}

export function archiveRepository(ctx: QueryContext, id: string) {
  const now = new Date().toISOString();
  ctx.db
    .prepare("UPDATE repositories SET archived_at = ?, updated_at = ? WHERE workspace_id = ? AND id = ?")
    .run(now, now, ctx.workspaceId, id);
}

function toRepositoryRow(row: RepositoryRecord): RepositoryRow {
  return {
    ...row,
    is_favorite: Boolean(row.is_favorite)
  };
}

