export const LOCAL_USER_ID = "local-user";
export const PERSONAL_WORKSPACE_ID = "personal-workspace";

export const exportEntityTables = [
  { entityName: "workspaces", tableName: "workspaces", scopeColumn: "id" },
  { entityName: "workspaceMembers", tableName: "workspace_members", scopeColumn: "workspace_id" },
  { entityName: "repositories", tableName: "repositories", scopeColumn: "workspace_id" },
  { entityName: "workItems", tableName: "work_items", scopeColumn: "workspace_id" },
  { entityName: "bugDetails", tableName: "bug_details", scopeColumn: "workspace_id" },
  { entityName: "ideas", tableName: "ideas", scopeColumn: "workspace_id" },
  { entityName: "techNotes", tableName: "tech_notes", scopeColumn: "workspace_id" },
  { entityName: "referenceServices", tableName: "reference_services", scopeColumn: "workspace_id" },
  { entityName: "tags", tableName: "tags", scopeColumn: "workspace_id" },
  { entityName: "workItemTags", tableName: "work_item_tags", scopeColumn: "workspace_id" },
  { entityName: "statusHistories", tableName: "status_histories", scopeColumn: "workspace_id" },
  { entityName: "repositoryVersions", tableName: "repository_versions", scopeColumn: "workspace_id" },
  { entityName: "classificationCandidates", tableName: "classification_candidates", scopeColumn: "workspace_id" }
] as const;

export type ExportEntityName = (typeof exportEntityTables)[number]["entityName"];
export type ExportEntityTable = (typeof exportEntityTables)[number];
