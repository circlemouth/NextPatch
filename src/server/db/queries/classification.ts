import { and, eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { classificationCandidates, workItems } from "@/server/db/schema";
import { applyStatusTimestamps } from "@/server/domain/status";
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
        status: defaultStatus(input.type),
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
    const memo = tx
      .select()
      .from(workItems)
      .where(and(eq(workItems.workspaceId, input.workspaceId), eq(workItems.id, input.memoId)))
      .get();

    if (!memo) {
      throw new Error(`Unreviewed memo not found: ${input.memoId}`);
    }

    if (memo.type !== "memo") {
      throw new Error(`Work item is not a memo: ${input.memoId}`);
    }

    if (memo.status !== "unreviewed") {
      throw new Error(`Memo is already classified: ${input.memoId}`);
    }

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

    const timestamps = applyStatusTimestamps(
      {
        type: memo.type as WorkItemType,
        status: memo.status,
        completed_at: memo.completedAt,
        closed_at: memo.closedAt
      },
      "itemized",
      now
    );

    const result = tx
      .update(workItems)
      .set({
        status: "itemized",
        completedAt: timestamps.completed_at,
        closedAt: timestamps.closed_at,
        statusChangedAt: timestamps.status_changed_at,
        updatedAt: now
      })
      .where(
        and(
          eq(workItems.workspaceId, input.workspaceId),
          eq(workItems.id, input.memoId),
          eq(workItems.type, "memo"),
          eq(workItems.status, "unreviewed")
        )
      )
      .run();

    if (result.changes !== 1) {
      throw new Error(`Failed to itemize memo: ${input.memoId}`);
    }
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
