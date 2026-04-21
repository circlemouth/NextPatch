import { randomUUID } from "node:crypto";

import { parseImportContent } from "@/server/domain/import-parser";
import type { QueryContext } from "@/server/db/queries/context";
import { createWorkItem } from "@/server/db/queries/work-items";
import type { PrivacyLevel, SourceType, WorkItemType } from "@/server/types";

export type QuickCaptureInput = {
  repositoryId?: string | null;
  type?: WorkItemType | "auto";
  title?: string | null;
  body: string;
  privacyLevel?: PrivacyLevel;
  isPinned?: boolean;
  sourceType?: Extract<SourceType, "manual" | "chatgpt">;
};

export function quickCapture(ctx: QueryContext, input: QuickCaptureInput) {
  const type = input.type === "auto" || !input.type ? "memo" : input.type;
  const memo = createWorkItem(ctx, {
    repositoryId: input.repositoryId,
    type,
    title: input.title || firstLine(input.body),
    body: input.body,
    privacyLevel: input.privacyLevel,
    isPinned: input.isPinned,
    sourceType: input.sourceType ?? "manual"
  });
  const importResult = parseImportContent(input.body);
  const now = new Date().toISOString();

  for (const candidate of importResult.candidates) {
    ctx.db
      .prepare(
        `
          INSERT INTO classification_candidates (
            id, workspace_id, user_id, memo_work_item_id, target_type, title,
            body, confidence, parse_source, parse_error, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        randomUUID(),
        ctx.workspaceId,
        ctx.userId,
        memo.id,
        candidate.targetType,
        candidate.title,
        candidate.body,
        candidate.confidence,
        importResult.format,
        importResult.error ?? null,
        now
      );
  }

  return {
    memo,
    candidates: importResult.candidates
  };
}

function firstLine(value: string) {
  return value.split(/\r?\n/).find(Boolean)?.slice(0, 80) || "Untitled memo";
}

