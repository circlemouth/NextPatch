import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { referenceServices, techNotes } from "@/server/db/schema";
import { assertPersonalWorkspaceScope } from "./context";

export async function listTechNotes(workspaceId: string) {
  assertPersonalWorkspaceScope(workspaceId);

  return getDb()
    .select()
    .from(techNotes)
    .where(and(eq(techNotes.workspaceId, workspaceId), isNull(techNotes.deletedAt)))
    .orderBy(desc(techNotes.updatedAt))
    .all();
}

export async function listReferenceServices(workspaceId: string) {
  assertPersonalWorkspaceScope(workspaceId);

  return getDb()
    .select()
    .from(referenceServices)
    .where(and(eq(referenceServices.workspaceId, workspaceId), isNull(referenceServices.deletedAt)))
    .orderBy(desc(referenceServices.updatedAt))
    .all();
}
