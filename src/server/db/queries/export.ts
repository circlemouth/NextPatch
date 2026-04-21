import crypto from "node:crypto";
import { getSqliteDb } from "../client";
import { exportEntityTables, LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "../schema";

export type ExportFormat = "json" | "csv" | "markdown";

export type LocalExportContext = {
  user: { id: typeof LOCAL_USER_ID };
  workspace: { id: typeof PERSONAL_WORKSPACE_ID; name: string };
};

type WorkspaceRow = {
  id: typeof PERSONAL_WORKSPACE_ID;
  name: string;
};

export function getLocalExportContext(): LocalExportContext {
  const db = getSqliteDb();
  const workspace = db
    .prepare("select id, name from workspaces where id = ?")
    .get(PERSONAL_WORKSPACE_ID) as WorkspaceRow | undefined;

  if (!workspace) {
    throw new Error("personal-workspace が SQLite DB に存在しません。migration と seed を実行してください。");
  }

  return {
    user: { id: LOCAL_USER_ID },
    workspace
  };
}

export function readWorkspaceExportEntities(workspaceId: typeof PERSONAL_WORKSPACE_ID) {
  const db = getSqliteDb();
  const entities: Record<string, unknown[]> = {};

  for (const table of exportEntityTables) {
    entities[table.entityName] = db
      .prepare(`select * from ${table.tableName} where ${table.scopeColumn} = ? order by id`)
      .all(workspaceId);
  }

  return entities;
}

export function insertExportLog(input: {
  workspaceId: typeof PERSONAL_WORKSPACE_ID;
  userId: typeof LOCAL_USER_ID;
  format: ExportFormat;
  contentHash: string;
}) {
  getSqliteDb()
    .prepare(
      `insert into export_logs (id, workspace_id, user_id, format, content_hash, created_at)
       values (?, ?, ?, ?, ?, ?)`
    )
    .run(crypto.randomUUID(), input.workspaceId, input.userId, input.format, input.contentHash, new Date().toISOString());
}
