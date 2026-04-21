import { randomUUID } from "node:crypto";

import { applyStatusTimestamps } from "@/server/domain/status";
import { defaultStatus } from "@/server/domain/work-item-defaults";
import type { QueryContext } from "@/server/db/queries/context";
import type { Priority, PrivacyLevel, ProductionStatus, SourceType, WorkItemRow, WorkItemType } from "@/server/types";

type WorkItemRecord = Omit<WorkItemRow, "is_pinned" | "repositories"> & {
  is_pinned: number;
  repository_name?: string | null;
  repository_production_status?: string | null;
};

export type CreateWorkItemInput = {
  repositoryId?: string | null;
  type: WorkItemType;
  title: string;
  body?: string | null;
  priority?: Priority;
  privacyLevel?: PrivacyLevel;
  isPinned?: boolean;
  sourceType?: SourceType;
  sourceRef?: string | null;
  externalUrl?: string | null;
};

export function createWorkItem(ctx: QueryContext, input: CreateWorkItemInput) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const repositoryId = input.repositoryId ?? null;
  const scope = repositoryId ? "repository" : input.type === "memo" ? "inbox" : "global";
  const status = defaultStatus(input.type);

  ctx.db
    .prepare(
      `
        INSERT INTO work_items (
          id, workspace_id, user_id, repository_id, scope, type, title, body,
          status, resolution, priority, source_type, source_ref, privacy_level,
          is_pinned, target_version_id, due_at, external_url, external_provider,
          external_id, status_changed_at, completed_at, closed_at, archived_at,
          deleted_at, created_at, updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL, NULL, ?,
          ?, NULL, ?, NULL, NULL, NULL, NULL, ?, ?
        )
      `
    )
    .run(
      id,
      ctx.workspaceId,
      ctx.userId,
      repositoryId,
      scope,
      input.type,
      input.title,
      input.body ?? null,
      status,
      input.priority ?? "p2",
      input.sourceType ?? "manual",
      input.sourceRef ?? null,
      input.privacyLevel ?? "normal",
      input.isPinned ? 1 : 0,
      input.externalUrl ?? null,
      input.externalUrl?.includes("github.com") ? "github" : null,
      now,
      now,
      now
    );

  return getWorkItem(ctx, id);
}

export function getWorkItem(ctx: QueryContext, id: string) {
  const row = ctx.db
    .prepare(
      `
        SELECT
          work_items.*,
          repositories.name AS repository_name,
          repositories.production_status AS repository_production_status
        FROM work_items
        LEFT JOIN repositories ON repositories.id = work_items.repository_id
        WHERE work_items.workspace_id = ? AND work_items.id = ?
      `
    )
    .get(ctx.workspaceId, id) as WorkItemRecord | undefined;

  if (!row) {
    throw new Error(`Work item not found: ${id}`);
  }

  return toWorkItemRow(row);
}

export function listWorkItems(ctx: QueryContext) {
  const rows = ctx.db
    .prepare(
      `
        SELECT
          work_items.*,
          repositories.name AS repository_name,
          repositories.production_status AS repository_production_status
        FROM work_items
        LEFT JOIN repositories ON repositories.id = work_items.repository_id
        WHERE work_items.workspace_id = ? AND work_items.deleted_at IS NULL
        ORDER BY work_items.updated_at DESC
      `
    )
    .all(ctx.workspaceId) as WorkItemRecord[];

  return rows.map(toWorkItemRow);
}

export function updateWorkItemStatus(ctx: QueryContext, id: string, status: string) {
  const item = getWorkItem(ctx, id);
  const timestamps = applyStatusTimestamps(item, status);
  const now = new Date().toISOString();

  ctx.db
    .prepare(
      `
        UPDATE work_items
        SET status = ?, completed_at = ?, closed_at = ?, status_changed_at = ?, updated_at = ?
        WHERE workspace_id = ? AND id = ?
      `
    )
    .run(
      status,
      timestamps.completed_at,
      timestamps.closed_at,
      timestamps.status_changed_at,
      now,
      ctx.workspaceId,
      id
    );

  ctx.db
    .prepare(
      `
        INSERT INTO status_histories (
          id, workspace_id, user_id, work_item_id, from_status, to_status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(randomUUID(), ctx.workspaceId, ctx.userId, id, item.status, status, now);

  return getWorkItem(ctx, id);
}

export function toWorkItemRow(row: WorkItemRecord): WorkItemRow {
  const {
    repository_name: repositoryName,
    repository_production_status: repositoryProductionStatus,
    ...item
  } = row;

  return {
    ...item,
    is_pinned: Boolean(item.is_pinned),
    repositories: repositoryName
      ? {
          name: repositoryName,
          production_status: repositoryProductionStatus as ProductionStatus
        }
      : null
  };
}
