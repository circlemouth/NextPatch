import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

const isoNow = sql<string>`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const repositoryProviderValues = ["manual", "github"] as const;
export const productionStatusValues = ["planning", "development", "active_production", "maintenance", "paused"] as const;
export const criticalityValues = ["high", "medium", "low"] as const;
export const workItemScopeValues = ["repository", "inbox", "global"] as const;
export const workItemTypeValues = ["task", "bug", "idea", "implementation", "future_feature", "memo"] as const;
export const priorityValues = ["p0", "p1", "p2", "p3", "p4"] as const;
export const sourceTypeValues = ["manual", "chatgpt", "github", "web", "import", "system"] as const;
export const privacyLevelValues = ["normal", "confidential", "secret", "no_ai"] as const;
export const workspaceRoleValues = ["owner", "member"] as const;

function enumCheck(column: AnySQLiteColumn, values: readonly string[]) {
  return sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;
}

export const localUsers = sqliteTable("local_users", {
  id: text("id").primaryKey(),
  email: text("email"),
  display_name: text("display_name"),
  created_at: text("created_at").notNull().default(isoNow),
  updated_at: text("updated_at").notNull().default(isoNow)
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  owner_user_id: text("owner_user_id")
    .notNull()
    .references(() => localUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  created_at: text("created_at").notNull().default(isoNow),
  updated_at: text("updated_at").notNull().default(isoNow),
  archived_at: text("archived_at"),
  deleted_at: text("deleted_at")
});

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspace_id: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => localUsers.id, { onDelete: "cascade" }),
    role: text("role", { enum: workspaceRoleValues }).notNull().default("owner"),
    created_at: text("created_at").notNull().default(isoNow)
  },
  (table) => [
    uniqueIndex("workspace_members_workspace_user_uidx").on(table.workspace_id, table.user_id),
    check("workspace_members_role_check", enumCheck(table.role, workspaceRoleValues))
  ]
);

export const repositories = sqliteTable(
  "repositories",
  {
    id: text("id").primaryKey(),
    workspace_id: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => localUsers.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: repositoryProviderValues }).notNull().default("manual"),
    name: text("name").notNull(),
    description: text("description"),
    html_url: text("html_url"),
    github_host: text("github_host"),
    github_owner: text("github_owner"),
    github_repo: text("github_repo"),
    github_full_name: text("github_full_name"),
    production_status: text("production_status", { enum: productionStatusValues }).notNull().default("development"),
    criticality: text("criticality", { enum: criticalityValues }).notNull().default("medium"),
    current_focus: text("current_focus"),
    next_version_id: text("next_version_id"),
    is_favorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
    sort_order: integer("sort_order"),
    created_at: text("created_at").notNull().default(isoNow),
    updated_at: text("updated_at").notNull().default(isoNow),
    archived_at: text("archived_at"),
    deleted_at: text("deleted_at")
  },
  (table) => [
    index("repositories_workspace_updated_idx").on(table.workspace_id, table.updated_at),
    check("repositories_provider_check", enumCheck(table.provider, repositoryProviderValues)),
    check("repositories_production_status_check", enumCheck(table.production_status, productionStatusValues)),
    check("repositories_criticality_check", enumCheck(table.criticality, criticalityValues))
  ]
);

export const repositoryVersions = sqliteTable("repository_versions", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id")
    .notNull()
    .references(() => localUsers.id, { onDelete: "cascade" }),
  repository_id: text("repository_id")
    .notNull()
    .references(() => repositories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  target_date: text("target_date"),
  created_at: text("created_at").notNull().default(isoNow),
  updated_at: text("updated_at").notNull().default(isoNow),
  archived_at: text("archived_at"),
  deleted_at: text("deleted_at")
});

export const workItems = sqliteTable(
  "work_items",
  {
    id: text("id").primaryKey(),
    workspace_id: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => localUsers.id, { onDelete: "cascade" }),
    repository_id: text("repository_id").references(() => repositories.id, { onDelete: "set null" }),
    scope: text("scope", { enum: workItemScopeValues }).notNull(),
    type: text("type", { enum: workItemTypeValues }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    status: text("status").notNull(),
    resolution: text("resolution"),
    priority: text("priority", { enum: priorityValues }).notNull().default("p2"),
    source_type: text("source_type", { enum: sourceTypeValues }).notNull().default("manual"),
    source_ref: text("source_ref"),
    privacy_level: text("privacy_level", { enum: privacyLevelValues }).notNull().default("normal"),
    is_pinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    target_version_id: text("target_version_id").references(() => repositoryVersions.id, { onDelete: "set null" }),
    due_at: text("due_at"),
    external_url: text("external_url"),
    external_provider: text("external_provider", { enum: ["github"] }),
    external_id: text("external_id"),
    status_changed_at: text("status_changed_at"),
    completed_at: text("completed_at"),
    closed_at: text("closed_at"),
    archived_at: text("archived_at"),
    deleted_at: text("deleted_at"),
    created_at: text("created_at").notNull().default(isoNow),
    updated_at: text("updated_at").notNull().default(isoNow)
  },
  (table) => [
    index("work_items_workspace_updated_idx").on(table.workspace_id, table.updated_at),
    index("work_items_repository_idx").on(table.repository_id),
    index("work_items_inbox_idx").on(table.workspace_id, table.type, table.status),
    check("work_items_scope_check", enumCheck(table.scope, workItemScopeValues)),
    check("work_items_type_check", enumCheck(table.type, workItemTypeValues)),
    check("work_items_priority_check", enumCheck(table.priority, priorityValues)),
    check("work_items_source_type_check", enumCheck(table.source_type, sourceTypeValues)),
    check("work_items_privacy_level_check", enumCheck(table.privacy_level, privacyLevelValues)),
    check(
      "work_items_scope_repository_consistency",
      sql`((${table.scope} = 'repository' and ${table.repository_id} is not null) or (${table.scope} in ('inbox', 'global') and ${table.repository_id} is null))`
    ),
    check("work_items_external_provider_check", sql`${table.external_provider} is null or ${table.external_provider} = 'github'`)
  ]
);

export const bugDetails = sqliteTable("bug_details", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id")
    .notNull()
    .references(() => localUsers.id, { onDelete: "cascade" }),
  work_item_id: text("work_item_id")
    .notNull()
    .unique()
    .references(() => workItems.id, { onDelete: "cascade" }),
  severity: text("severity").notNull().default("s3"),
  reproduction_steps: text("reproduction_steps"),
  expected_result: text("expected_result"),
  actual_result: text("actual_result"),
  environment: text("environment"),
  fixed_at: text("fixed_at"),
  created_at: text("created_at").notNull().default(isoNow),
  updated_at: text("updated_at").notNull().default(isoNow)
});

export const ideas = sqliteTable("ideas", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id")
    .notNull()
    .references(() => localUsers.id, { onDelete: "cascade" }),
  work_item_id: text("work_item_id")
    .notNull()
    .unique()
    .references(() => workItems.id, { onDelete: "cascade" }),
  value_hypothesis: text("value_hypothesis"),
  target_user: text("target_user"),
  feasibility: text("feasibility"),
  decision: text("decision"),
  promoted_work_item_id: text("promoted_work_item_id").references(() => workItems.id, { onDelete: "set null" }),
  created_at: text("created_at").notNull().default(isoNow),
  updated_at: text("updated_at").notNull().default(isoNow)
});

export const techNotes = sqliteTable(
  "tech_notes",
  {
    id: text("id").primaryKey(),
    workspace_id: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => localUsers.id, { onDelete: "cascade" }),
    repository_id: text("repository_id").references(() => repositories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    category: text("category"),
    adoption_status: text("adoption_status").notNull().default("candidate"),
    reason: text("reason"),
    official_url: text("official_url"),
    concerns: text("concerns"),
    created_at: text("created_at").notNull().default(isoNow),
    updated_at: text("updated_at").notNull().default(isoNow),
    archived_at: text("archived_at"),
    deleted_at: text("deleted_at")
  },
  (table) => [index("tech_notes_workspace_updated_idx").on(table.workspace_id, table.updated_at)]
);

export const referenceServices = sqliteTable(
  "reference_services",
  {
    id: text("id").primaryKey(),
    workspace_id: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => localUsers.id, { onDelete: "cascade" }),
    repository_id: text("repository_id").references(() => repositories.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    url: text("url"),
    reference_point: text("reference_point"),
    strengths: text("strengths"),
    concerns: text("concerns"),
    created_at: text("created_at").notNull().default(isoNow),
    updated_at: text("updated_at").notNull().default(isoNow),
    archived_at: text("archived_at"),
    deleted_at: text("deleted_at")
  },
  (table) => [index("reference_services_workspace_updated_idx").on(table.workspace_id, table.updated_at)]
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    workspace_id: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => localUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    created_at: text("created_at").notNull().default(isoNow)
  },
  (table) => [uniqueIndex("tags_workspace_name_uidx").on(table.workspace_id, table.name)]
);

export const workItemTags = sqliteTable(
  "work_item_tags",
  {
    id: text("id").primaryKey(),
    workspace_id: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => localUsers.id, { onDelete: "cascade" }),
    work_item_id: text("work_item_id")
      .notNull()
      .references(() => workItems.id, { onDelete: "cascade" }),
    tag_id: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    created_at: text("created_at").notNull().default(isoNow)
  },
  (table) => [uniqueIndex("work_item_tags_work_item_tag_uidx").on(table.work_item_id, table.tag_id)]
);

export const statusHistories = sqliteTable(
  "status_histories",
  {
    id: text("id").primaryKey(),
    workspace_id: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => localUsers.id, { onDelete: "cascade" }),
    work_item_id: text("work_item_id")
      .notNull()
      .references(() => workItems.id, { onDelete: "cascade" }),
    from_status: text("from_status"),
    to_status: text("to_status").notNull(),
    reason: text("reason"),
    created_at: text("created_at").notNull().default(isoNow)
  },
  (table) => [index("status_histories_work_item_idx").on(table.work_item_id, table.created_at)]
);

export const classificationCandidates = sqliteTable(
  "classification_candidates",
  {
    id: text("id").primaryKey(),
    workspace_id: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => localUsers.id, { onDelete: "cascade" }),
    memo_work_item_id: text("memo_work_item_id")
      .notNull()
      .references(() => workItems.id, { onDelete: "cascade" }),
    target_type: text("target_type", { enum: workItemTypeValues }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    confidence: text("confidence").notNull().default("medium"),
    parse_source: text("parse_source"),
    parse_error: text("parse_error"),
    applied_at: text("applied_at"),
    created_at: text("created_at").notNull().default(isoNow)
  },
  (table) => [check("classification_candidates_target_type_check", enumCheck(table.target_type, workItemTypeValues))]
);

export const exportLogs = sqliteTable("export_logs", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id")
    .notNull()
    .references(() => localUsers.id, { onDelete: "cascade" }),
  format: text("format").notNull(),
  content_hash: text("content_hash"),
  created_at: text("created_at").notNull().default(isoNow)
});

export const importJobs = sqliteTable("import_jobs", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id")
    .notNull()
    .references(() => localUsers.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("created"),
  source_format: text("source_format").notNull().default("json"),
  error_message: text("error_message"),
  created_at: text("created_at").notNull().default(isoNow),
  finished_at: text("finished_at")
});

export type LocalUser = typeof localUsers.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type WorkItem = typeof workItems.$inferSelect;
