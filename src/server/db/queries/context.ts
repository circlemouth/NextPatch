import crypto from "node:crypto";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { getDb, getSqliteClient } from "@/server/db/client";
import {
  classificationCandidates,
  localUsers,
  referenceServices,
  repositories,
  statusHistories,
  techNotes,
  workItems,
  workspaces,
  workspaceMembers
} from "@/server/db/schema";
import type { Criticality, PrivacyLevel, Priority, ProductionStatus, RepositoryRow, SourceType, WorkItemRow, WorkItemScope, WorkItemType } from "@/server/types";
import * as schema from "@/server/db/schema";

export const LOCAL_USER_ID = "local-user";
export const PERSONAL_WORKSPACE_ID = "personal-workspace";

const LOCAL_MEMBER_ID = "personal-workspace-owner";

export type LocalUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export type QueryContext = {
  db: BetterSQLite3Database<typeof schema>;
  user: LocalUser;
  workspace: {
    id: string;
    name: string;
  };
};

type Db = BetterSQLite3Database<typeof schema>;

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return crypto.randomUUID();
}

export function ensureLocalContext(db: Db = getDb()): QueryContext {
  const now = nowIso();

  db.insert(localUsers)
    .values({
      id: LOCAL_USER_ID,
      email: "local-user@nextpatch.local",
      display_name: "Local user",
      updated_at: now
    })
    .onConflictDoUpdate({
      target: localUsers.id,
      set: {
        email: "local-user@nextpatch.local",
        display_name: "Local user",
        updated_at: now
      }
    })
    .run();

  db.insert(workspaces)
    .values({
      id: PERSONAL_WORKSPACE_ID,
      owner_user_id: LOCAL_USER_ID,
      name: "Personal workspace",
      updated_at: now
    })
    .onConflictDoUpdate({
      target: workspaces.id,
      set: {
        owner_user_id: LOCAL_USER_ID,
        name: "Personal workspace",
        updated_at: now
      }
    })
    .run();

  db.insert(workspaceMembers)
    .values({
      id: LOCAL_MEMBER_ID,
      workspace_id: PERSONAL_WORKSPACE_ID,
      user_id: LOCAL_USER_ID,
      role: "owner"
    })
    .onConflictDoUpdate({
      target: workspaceMembers.id,
      set: {
        workspace_id: PERSONAL_WORKSPACE_ID,
        user_id: LOCAL_USER_ID,
        role: "owner"
      }
    })
    .run();

  return {
    db,
    user: {
      id: LOCAL_USER_ID,
      email: "local-user@nextpatch.local",
      displayName: "Local user"
    },
    workspace: {
      id: PERSONAL_WORKSPACE_ID,
      name: "Personal workspace"
    }
  };
}

export function getQueryContext(): QueryContext {
  return ensureLocalContext(getDb());
}

export function listRepositories(workspaceId: string): RepositoryRow[] {
  return getDb()
    .select()
    .from(repositories)
    .where(and(eq(repositories.workspace_id, workspaceId), isNull(repositories.deleted_at)))
    .orderBy(desc(repositories.updated_at))
    .all();
}

export function getRepository(workspaceId: string, repositoryId: string): RepositoryRow {
  const repository = getDb()
    .select()
    .from(repositories)
    .where(and(eq(repositories.workspace_id, workspaceId), eq(repositories.id, repositoryId)))
    .get();

  if (!repository) {
    throw new Error("Repository not found.");
  }

  return repository;
}

export type CreateRepositoryInput = {
  workspace_id: string;
  user_id: string;
  provider: "manual" | "github";
  name: string;
  description: string | null;
  html_url: string | null;
  github_host: string | null;
  github_owner: string | null;
  github_repo: string | null;
  github_full_name: string | null;
  production_status: ProductionStatus;
  criticality: Criticality;
  current_focus: string | null;
};

export function createRepository(input: CreateRepositoryInput) {
  const [repository] = getDb()
    .insert(repositories)
    .values({
      id: newId(),
      ...input,
      updated_at: nowIso()
    })
    .returning({ id: repositories.id })
    .all();

  return repository;
}

export function archiveRepositoryById(workspaceId: string, repositoryId: string) {
  getDb()
    .update(repositories)
    .set({
      archived_at: nowIso(),
      updated_at: nowIso()
    })
    .where(and(eq(repositories.workspace_id, workspaceId), eq(repositories.id, repositoryId)))
    .run();
}

export type ListWorkItemsOptions = {
  workspaceId: string;
  repositoryId?: string;
  types?: WorkItemType[];
  includeRepository?: boolean;
};

export function listWorkItems(options: ListWorkItemsOptions): WorkItemRow[] {
  const conditions = [eq(workItems.workspace_id, options.workspaceId), isNull(workItems.deleted_at)];

  if (options.repositoryId) {
    conditions.push(eq(workItems.repository_id, options.repositoryId));
  }

  if (options.types && options.types.length > 0) {
    conditions.push(inArray(workItems.type, options.types));
  }

  if (!options.includeRepository) {
    return getDb().select().from(workItems).where(and(...conditions)).orderBy(desc(workItems.updated_at)).all();
  }

  const rows = getDb()
    .select({
      item: workItems,
      repository_name: repositories.name,
      repository_production_status: repositories.production_status
    })
    .from(workItems)
    .leftJoin(repositories, eq(workItems.repository_id, repositories.id))
    .where(and(...conditions))
    .orderBy(desc(workItems.updated_at))
    .all();

  return rows.map((row) => ({
    ...row.item,
    repositories: row.repository_name
      ? {
          name: row.repository_name,
          production_status: row.repository_production_status ?? "development"
        }
      : null
  }));
}

export function getWorkItem(workspaceId: string, workItemId: string): WorkItemRow {
  const item = getDb()
    .select()
    .from(workItems)
    .where(and(eq(workItems.workspace_id, workspaceId), eq(workItems.id, workItemId)))
    .get();

  if (!item) {
    throw new Error("Work item not found.");
  }

  return item;
}

export type CreateWorkItemInput = {
  workspace_id: string;
  user_id: string;
  repository_id: string | null;
  scope: WorkItemScope;
  type: WorkItemType;
  title: string;
  body?: string | null;
  status: string;
  resolution?: string | null;
  priority?: Priority;
  source_type?: SourceType;
  source_ref?: string | null;
  privacy_level?: PrivacyLevel;
  is_pinned?: boolean;
  target_version_id?: string | null;
  due_at?: string | null;
  external_url?: string | null;
  external_provider?: "github" | null;
  external_id?: string | null;
};

export function createWorkItem(input: CreateWorkItemInput) {
  const [item] = getDb()
    .insert(workItems)
    .values({
      id: newId(),
      body: null,
      resolution: null,
      priority: "p2",
      source_type: "manual",
      source_ref: null,
      privacy_level: "normal",
      is_pinned: false,
      target_version_id: null,
      due_at: null,
      external_url: null,
      external_provider: null,
      external_id: null,
      ...input,
      updated_at: nowIso()
    })
    .returning({ id: workItems.id })
    .all();

  return item;
}

export function updateWorkItemStatus(workspaceId: string, workItemId: string, status: string, timestamps: Partial<WorkItemRow>) {
  getDb()
    .update(workItems)
    .set({
      status,
      status_changed_at: nowIso(),
      completed_at: timestamps.completed_at ?? null,
      closed_at: timestamps.closed_at ?? null,
      updated_at: nowIso()
    })
    .where(and(eq(workItems.workspace_id, workspaceId), eq(workItems.id, workItemId)))
    .run();
}

export function insertStatusHistory(input: {
  workspace_id: string;
  user_id: string;
  work_item_id: string;
  from_status: string | null;
  to_status: string;
  reason?: string | null;
}) {
  getDb()
    .insert(statusHistories)
    .values({
      id: newId(),
      reason: null,
      ...input
    })
    .run();
}

export function createClassificationCandidates(
  candidates: Array<{
    workspace_id: string;
    user_id: string;
    memo_work_item_id: string;
    target_type: WorkItemType;
    title: string;
    body: string | null;
    confidence: string;
    parse_source: string;
    parse_error: string | null;
  }>
) {
  if (candidates.length === 0) {
    return;
  }

  getDb()
    .insert(classificationCandidates)
    .values(candidates.map((candidate) => ({ id: newId(), ...candidate })))
    .run();
}

export function listTechNotes(workspaceId: string) {
  return getDb()
    .select()
    .from(techNotes)
    .where(and(eq(techNotes.workspace_id, workspaceId), isNull(techNotes.deleted_at)))
    .orderBy(desc(techNotes.updated_at))
    .all();
}

export function listReferenceServices(workspaceId: string) {
  return getDb()
    .select()
    .from(referenceServices)
    .where(and(eq(referenceServices.workspace_id, workspaceId), isNull(referenceServices.deleted_at)))
    .orderBy(desc(referenceServices.updated_at))
    .all();
}

const exportTables = [
  ["workspaces", "workspaces", "id"],
  ["workspaceMembers", "workspace_members", "workspace_id"],
  ["repositories", "repositories", "workspace_id"],
  ["workItems", "work_items", "workspace_id"],
  ["bugDetails", "bug_details", "workspace_id"],
  ["ideas", "ideas", "workspace_id"],
  ["techNotes", "tech_notes", "workspace_id"],
  ["referenceServices", "reference_services", "workspace_id"],
  ["tags", "tags", "workspace_id"],
  ["workItemTags", "work_item_tags", "workspace_id"],
  ["statusHistories", "status_histories", "workspace_id"],
  ["repositoryVersions", "repository_versions", "workspace_id"],
  ["classificationCandidates", "classification_candidates", "workspace_id"]
] as const;

export function getWorkspaceExportEntities(workspaceId: string) {
  const sqlite = getSqliteClient();
  const entities: Record<string, unknown[]> = {};

  for (const [entityName, tableName, workspaceColumn] of exportTables) {
    entities[entityName] = sqlite.prepare(`select * from ${tableName} where ${workspaceColumn} = ?`).all(workspaceId);
  }

  return entities;
}
