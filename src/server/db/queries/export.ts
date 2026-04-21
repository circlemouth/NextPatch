import { getDb } from "@/server/db/client";

const tableByEntity = {
  workspaces: "workspaces",
  workspaceMembers: "workspace_members",
  repositories: "repositories",
  workItems: "work_items",
  bugDetails: "bug_details",
  ideas: "ideas",
  techNotes: "tech_notes",
  referenceServices: "reference_services",
  tags: "tags",
  workItemTags: "work_item_tags",
  statusHistories: "status_histories",
  repositoryVersions: "repository_versions",
  classificationCandidates: "classification_candidates"
} as const;

export async function getBackupEntities(workspaceId: string) {
  const db = getDb();
  const entities: Record<string, unknown[]> = {};

  for (const [entityName, tableName] of Object.entries(tableByEntity)) {
    const sql =
      tableName === "workspaces"
        ? `select * from ${tableName} where id = ?`
        : `select * from ${tableName} where workspace_id = ?`;
    entities[entityName] = db.prepare(sql).all(workspaceId);
  }

  return entities;
}
