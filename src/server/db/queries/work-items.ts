import { randomUUID } from "node:crypto";
import { getDb } from "@/server/db/client";
import { mapWorkItem } from "@/server/db/queries/mappers";
import { applyStatusTimestamps } from "@/server/domain/status";
import type { Priority, PrivacyLevel, SourceType, WorkItemRow, WorkItemType } from "@/server/types";

export type CreateWorkItemInput = {
  workspaceId: string;
  userId: string;
  repositoryId: string | null;
  scope: WorkItemRow["scope"];
  type: WorkItemType;
  title: string;
  body?: string | null;
  status: string;
  priority: Priority;
  sourceType: SourceType;
  sourceRef?: string | null;
  privacyLevel: PrivacyLevel;
  isPinned?: boolean;
  externalUrl?: string | null;
  externalProvider?: "github" | null;
};

export type ClassificationCandidateInput = {
  targetType: WorkItemType;
  title: string;
  body?: string | null;
  confidence: string;
  parseSource: string;
  parseError?: string | null;
};

export async function listWorkItems(workspaceId: string) {
  const rows = getDb()
    .prepare(
      `
        select wi.*, r.name as repository_name, r.production_status as repository_production_status
        from work_items wi
        left join repositories r on r.id = wi.repository_id
        where wi.workspace_id = ? and wi.deleted_at is null
        order by wi.updated_at desc
      `
    )
    .all(workspaceId) as WorkItemRow[];

  return rows.map(mapWorkItem);
}

export async function listMemos(workspaceId: string) {
  const rows = getDb()
    .prepare(
      `
        select wi.*, r.name as repository_name, r.production_status as repository_production_status
        from work_items wi
        left join repositories r on r.id = wi.repository_id
        where wi.workspace_id = ? and wi.type = 'memo' and wi.deleted_at is null
        order by wi.updated_at desc
      `
    )
    .all(workspaceId) as WorkItemRow[];

  return rows.map(mapWorkItem);
}

export async function listIdeaItems(workspaceId: string) {
  const rows = getDb()
    .prepare(
      `
        select wi.*, r.name as repository_name, r.production_status as repository_production_status
        from work_items wi
        left join repositories r on r.id = wi.repository_id
        where wi.workspace_id = ?
          and wi.type in ('idea', 'future_feature', 'implementation')
          and wi.deleted_at is null
        order by wi.updated_at desc
      `
    )
    .all(workspaceId) as WorkItemRow[];

  return rows.map(mapWorkItem);
}

export async function getWorkItem(workspaceId: string, workItemId: string) {
  const row = getDb()
    .prepare(
      `
        select wi.*, r.name as repository_name, r.production_status as repository_production_status
        from work_items wi
        left join repositories r on r.id = wi.repository_id
        where wi.workspace_id = ? and wi.id = ? and wi.deleted_at is null
      `
    )
    .get(workspaceId, workItemId) as WorkItemRow | undefined;

  if (!row) {
    throw new Error("Work item not found.");
  }

  return mapWorkItem(row);
}

export async function createWorkItemRecord(input: CreateWorkItemInput) {
  const id = randomUUID();
  insertWorkItem({ ...input, id });
  return id;
}

export async function createCapturedWorkItem(input: CreateWorkItemInput, candidates: ClassificationCandidateInput[]) {
  const db = getDb();
  const id = randomUUID();

  db.transaction(() => {
    insertWorkItem({ ...input, id });

    for (const candidate of candidates) {
      db.prepare(
        `
          insert into classification_candidates (
            id, workspace_id, user_id, memo_work_item_id, target_type, title,
            body, confidence, parse_source, parse_error, created_at
          )
          values (
            @id, @workspaceId, @userId, @memoWorkItemId, @targetType, @title,
            @body, @confidence, @parseSource, @parseError, @now
          )
        `
      ).run({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        userId: input.userId,
        memoWorkItemId: id,
        targetType: candidate.targetType,
        title: candidate.title,
        body: candidate.body ?? null,
        confidence: candidate.confidence,
        parseSource: candidate.parseSource,
        parseError: candidate.parseError ?? null,
        now: new Date().toISOString()
      });
    }
  })();

  return id;
}

export async function updateWorkItemStatusRecord(workspaceId: string, userId: string, workItemId: string, status: string) {
  const db = getDb();
  const item = db.prepare("select * from work_items where workspace_id = ? and id = ?").get(workspaceId, workItemId) as
    | WorkItemRow
    | undefined;

  if (!item) {
    throw new Error("Work item not found.");
  }

  const timestamps = applyStatusTimestamps(item, status);

  db.transaction(() => {
    db.prepare(
      `
        update work_items
        set status = @status,
          completed_at = @completedAt,
          closed_at = @closedAt,
          status_changed_at = @statusChangedAt,
          updated_at = @now
        where workspace_id = @workspaceId and id = @workItemId
      `
    ).run({
      status,
      completedAt: timestamps.completed_at,
      closedAt: timestamps.closed_at,
      statusChangedAt: timestamps.status_changed_at,
      now: new Date().toISOString(),
      workspaceId,
      workItemId
    });

    db.prepare(
      `
        insert into status_histories (
          id, workspace_id, user_id, work_item_id, from_status, to_status, created_at
        )
        values (@id, @workspaceId, @userId, @workItemId, @fromStatus, @toStatus, @now)
      `
    ).run({
      id: randomUUID(),
      workspaceId,
      userId,
      workItemId,
      fromStatus: item.status,
      toStatus: status,
      now: new Date().toISOString()
    });
  })();
}

export async function classifyMemoRecord(input: CreateWorkItemInput & { memoId: string }) {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.transaction(() => {
    insertWorkItem({ ...input, id });
    db.prepare(
      `
        update work_items
        set status = 'itemized', completed_at = @now, closed_at = @now, status_changed_at = @now, updated_at = @now
        where workspace_id = @workspaceId and id = @memoId
      `
    ).run({
      now,
      workspaceId: input.workspaceId,
      memoId: input.memoId
    });
  })();

  return id;
}

function insertWorkItem(input: CreateWorkItemInput & { id: string }) {
  const now = new Date().toISOString();

  getDb()
    .prepare(
      `
        insert into work_items (
          id, workspace_id, user_id, repository_id, scope, type, title, body,
          status, priority, source_type, source_ref, privacy_level, is_pinned,
          external_url, external_provider, created_at, updated_at
        )
        values (
          @id, @workspaceId, @userId, @repositoryId, @scope, @type, @title, @body,
          @status, @priority, @sourceType, @sourceRef, @privacyLevel, @isPinned,
          @externalUrl, @externalProvider, @now, @now
        )
      `
    )
    .run({
      id: input.id,
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
      isPinned: input.isPinned ? 1 : 0,
      externalUrl: input.externalUrl ?? null,
      externalProvider: input.externalProvider ?? null,
      now
    });
}
