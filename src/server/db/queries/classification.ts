import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { classificationCandidates, workItems } from "@/server/db/schema";
import { defaultStatus } from "@/server/domain/work-item-defaults";
import type { ImportCandidate, ImportParseResult } from "@/server/domain/import-parser";
import type { PrivacyLevel, SourceType, WorkItemScope, WorkItemType } from "@/server/types";
import { assertPersonalWorkspaceScope } from "./context";

type QuickCaptureInput = {
  workspaceId: string;
  userId: string;
  repositoryId: string | null;
  scope: WorkItemScope;
  type: WorkItemType;
  title: string;
  body: string;
  privacyLevel: PrivacyLevel;
  isPinned: boolean;
  sourceType: SourceType;
  importResult: ImportParseResult;
};

type ClassifyMemoInput = {
  workspaceId: string;
  userId: string;
  memoId: string;
  repositoryId: string | null;
  targetType: WorkItemType;
  title: string;
  body?: string | null;
  priority: "p0" | "p1" | "p2" | "p3" | "p4";
};

export async function quickCaptureCommand(input: QuickCaptureInput) {
  assertPersonalWorkspaceScope(input.workspaceId);

  const memoId = crypto.randomUUID();
  const now = new Date().toISOString();

  getDb().transaction((tx) => {
    tx.insert(workItems)
      .values({
        id: memoId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        repositoryId: input.repositoryId,
        scope: input.scope,
        type: input.type,
        title: input.title,
        body: input.body,
        status: input.type === "memo" ? "unreviewed" : "todo",
        priority: "p2",
        sourceType: input.sourceType,
        privacyLevel: input.privacyLevel,
        isPinned: input.isPinned,
        createdAt: now,
        updatedAt: now
      })
      .run();

    if (input.importResult.candidates.length > 0) {
      tx.insert(classificationCandidates)
        .values(
          input.importResult.candidates.map((candidate) =>
            toClassificationCandidate(input.workspaceId, input.userId, memoId, input.importResult, candidate, now)
          )
        )
        .run();
    }
  });

  return memoId;
}

export async function classifyMemoCommand(input: ClassifyMemoInput) {
  assertPersonalWorkspaceScope(input.workspaceId);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  getDb().transaction((tx) => {
    tx.insert(workItems)
      .values({
        id,
        workspaceId: input.workspaceId,
        userId: input.userId,
        repositoryId: input.repositoryId,
        scope: input.repositoryId ? "repository" : "global",
        type: input.targetType,
        title: input.title,
        body: input.body ?? null,
        status: defaultStatus(input.targetType),
        priority: input.priority,
        sourceType: "manual",
        sourceRef: input.memoId,
        privacyLevel: "normal",
        isPinned: false,
        createdAt: now,
        updatedAt: now
      })
      .run();

    tx.update(workItems)
      .set({
        status: "itemized",
        completedAt: now,
        closedAt: now,
        statusChangedAt: now,
        updatedAt: now
      })
      .where(and(eq(workItems.workspaceId, input.workspaceId), eq(workItems.id, input.memoId)))
      .run();
  });

  return id;
}

function toClassificationCandidate(
  workspaceId: string,
  userId: string,
  memoWorkItemId: string,
  importResult: ImportParseResult,
  candidate: ImportCandidate,
  now: string
) {
  return {
    id: crypto.randomUUID(),
    workspaceId,
    userId,
    memoWorkItemId,
    targetType: candidate.targetType,
    title: candidate.title,
    body: candidate.body,
    confidence: candidate.confidence,
    parseSource: importResult.format,
    parseError: importResult.error ?? null,
    createdAt: now
  };
}
