import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { PERSONAL_WORKSPACE_ID } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import {
  bugDetails,
  classificationCandidates,
  exportLogs,
  ideas,
  referenceServices,
  repositories,
  repositoryVersions,
  statusHistories,
  tags,
  techNotes,
  workItemTags,
  workItems,
  workspaceMembers,
  workspaces
} from "@/server/db/schema";
import { assertPersonalWorkspaceScope } from "./context";
import { toPlainRow } from "./mappers";

export type ExportFormat = "json" | "csv" | "markdown";

export async function readBackupEntities(workspaceId = PERSONAL_WORKSPACE_ID) {
  assertPersonalWorkspaceScope(workspaceId);

  return {
    workspaces: getDb().select().from(workspaces).where(eq(workspaces.id, workspaceId)).all().map(toPlainRow),
    workspaceMembers: scoped(workspaceMembers, workspaceMembers.workspaceId, workspaceId),
    repositories: scoped(repositories, repositories.workspaceId, workspaceId),
    workItems: scoped(workItems, workItems.workspaceId, workspaceId),
    bugDetails: scoped(bugDetails, bugDetails.workspaceId, workspaceId),
    ideas: scoped(ideas, ideas.workspaceId, workspaceId),
    techNotes: scoped(techNotes, techNotes.workspaceId, workspaceId),
    referenceServices: scoped(referenceServices, referenceServices.workspaceId, workspaceId),
    tags: scoped(tags, tags.workspaceId, workspaceId),
    workItemTags: scoped(workItemTags, workItemTags.workspaceId, workspaceId),
    statusHistories: scoped(statusHistories, statusHistories.workspaceId, workspaceId),
    repositoryVersions: scoped(repositoryVersions, repositoryVersions.workspaceId, workspaceId),
    classificationCandidates: scoped(classificationCandidates, classificationCandidates.workspaceId, workspaceId)
  };
}

function scoped<TTable extends { _: { columns: Record<string, unknown> } }>(
  table: TTable,
  workspaceColumn: Parameters<typeof eq>[0],
  workspaceId: string
) {
  return getDb()
    .select()
    .from(table as never)
    .where(eq(workspaceColumn, workspaceId))
    .all()
    .map(toPlainRow);
}

export function insertExportLog(input: { workspaceId: string; userId: string; format: ExportFormat; contentHash: string }) {
  assertPersonalWorkspaceScope(input.workspaceId);

  getDb()
    .insert(exportLogs)
    .values({
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      userId: input.userId,
      format: input.format,
      contentHash: input.contentHash,
      createdAt: new Date().toISOString()
    })
    .run();
}
