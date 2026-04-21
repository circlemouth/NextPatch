import { backupEntityTables, buildBackupDocument } from "@/server/domain/export";
import type { QueryContext } from "@/server/db/queries/context";

export function createBackupDocumentFromDatabase(ctx: QueryContext, exportedAt?: string) {
  const entities: Record<string, unknown[]> = {};

  for (const [entityName, tableName] of backupEntityTables) {
    const sql =
      tableName === "workspaces"
        ? `SELECT * FROM ${tableName} WHERE id = ?`
        : `SELECT * FROM ${tableName} WHERE workspace_id = ?`;
    entities[entityName] = ctx.db.prepare(sql).all(ctx.workspaceId) as unknown[];
  }

  return buildBackupDocument({ workspaceId: ctx.workspaceId, entities, exportedAt });
}

