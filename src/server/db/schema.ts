import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const localUsers = sqliteTable("local_users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archivedAt: text("archived_at"),
  deletedAt: text("deleted_at")
});

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull().default("owner"),
    createdAt: text("created_at").notNull()
  },
  (table) => [uniqueIndex("workspace_members_workspace_user_idx").on(table.workspaceId, table.userId)]
);

export const repositoryVersions = sqliteTable("repository_versions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  repositoryId: text("repository_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  targetDate: text("target_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archivedAt: text("archived_at"),
  deletedAt: text("deleted_at")
});

export const repositories = sqliteTable(
  "repositories",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    provider: text("provider").notNull().default("manual"),
    name: text("name").notNull(),
    description: text("description"),
    htmlUrl: text("html_url"),
    githubHost: text("github_host"),
    githubOwner: text("github_owner"),
    githubRepo: text("github_repo"),
    githubFullName: text("github_full_name"),
    productionStatus: text("production_status").notNull().default("development"),
    criticality: text("criticality").notNull().default("medium"),
    currentFocus: text("current_focus"),
    nextVersionId: text("next_version_id"),
    isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    archivedAt: text("archived_at"),
    deletedAt: text("deleted_at")
  },
  (table) => [index("repositories_workspace_idx").on(table.workspaceId, table.updatedAt)]
);

export const workItems = sqliteTable(
  "work_items",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    repositoryId: text("repository_id"),
    scope: text("scope").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    status: text("status").notNull(),
    resolution: text("resolution"),
    priority: text("priority").notNull().default("p2"),
    sourceType: text("source_type").notNull().default("manual"),
    sourceRef: text("source_ref"),
    privacyLevel: text("privacy_level").notNull().default("normal"),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    targetVersionId: text("target_version_id"),
    dueAt: text("due_at"),
    externalUrl: text("external_url"),
    externalProvider: text("external_provider"),
    externalId: text("external_id"),
    statusChangedAt: text("status_changed_at"),
    completedAt: text("completed_at"),
    closedAt: text("closed_at"),
    archivedAt: text("archived_at"),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => [
    index("work_items_workspace_idx").on(table.workspaceId, table.updatedAt),
    index("work_items_repository_idx").on(table.repositoryId),
    index("work_items_inbox_idx").on(table.workspaceId, table.type, table.status)
  ]
);

export const bugDetails = sqliteTable("bug_details", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  workItemId: text("work_item_id").notNull().unique(),
  severity: text("severity").notNull().default("s3"),
  reproductionSteps: text("reproduction_steps"),
  expectedResult: text("expected_result"),
  actualResult: text("actual_result"),
  environment: text("environment"),
  fixedAt: text("fixed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const ideas = sqliteTable("ideas", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  workItemId: text("work_item_id").notNull().unique(),
  valueHypothesis: text("value_hypothesis"),
  targetUser: text("target_user"),
  feasibility: text("feasibility"),
  decision: text("decision"),
  promotedWorkItemId: text("promoted_work_item_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const techNotes = sqliteTable("tech_notes", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  repositoryId: text("repository_id"),
  name: text("name").notNull(),
  category: text("category"),
  adoptionStatus: text("adoption_status").notNull().default("candidate"),
  reason: text("reason"),
  officialUrl: text("official_url"),
  concerns: text("concerns"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archivedAt: text("archived_at"),
  deletedAt: text("deleted_at")
});

export const referenceServices = sqliteTable("reference_services", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  repositoryId: text("repository_id"),
  name: text("name").notNull(),
  url: text("url"),
  referencePoint: text("reference_point"),
  strengths: text("strengths"),
  concerns: text("concerns"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  archivedAt: text("archived_at"),
  deletedAt: text("deleted_at")
});

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: text("created_at").notNull()
  },
  (table) => [uniqueIndex("tags_workspace_name_idx").on(table.workspaceId, table.name)]
);

export const workItemTags = sqliteTable(
  "work_item_tags",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    workItemId: text("work_item_id").notNull(),
    tagId: text("tag_id").notNull(),
    createdAt: text("created_at").notNull()
  },
  (table) => [uniqueIndex("work_item_tags_work_item_tag_idx").on(table.workItemId, table.tagId)]
);

export const statusHistories = sqliteTable(
  "status_histories",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    userId: text("user_id").notNull(),
    workItemId: text("work_item_id").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    reason: text("reason"),
    createdAt: text("created_at").notNull()
  },
  (table) => [index("status_histories_work_item_idx").on(table.workItemId, table.createdAt)]
);

export const classificationCandidates = sqliteTable("classification_candidates", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  memoWorkItemId: text("memo_work_item_id").notNull(),
  targetType: text("target_type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  confidence: text("confidence").notNull().default("medium"),
  parseSource: text("parse_source"),
  parseError: text("parse_error"),
  appliedAt: text("applied_at"),
  createdAt: text("created_at").notNull()
});

export const exportLogs = sqliteTable("export_logs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  format: text("format").notNull(),
  contentHash: text("content_hash"),
  createdAt: text("created_at").notNull()
});

export const importJobs = sqliteTable("import_jobs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  status: text("status").notNull().default("created"),
  sourceFormat: text("source_format").notNull().default("json"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
  finishedAt: text("finished_at")
});
