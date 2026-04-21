import type { QueryContext } from "@/server/db/queries/context";
import { createWorkItem, updateWorkItemStatus } from "@/server/db/queries/work-items";
import type { Priority, WorkItemType } from "@/server/types";

export type ClassifyMemoInput = {
  memoId: string;
  targetType: Exclude<WorkItemType, "memo"> | WorkItemType;
  repositoryId?: string | null;
  title: string;
  body?: string | null;
  priority?: Priority;
};

export function classifyMemo(ctx: QueryContext, input: ClassifyMemoInput) {
  const item = createWorkItem(ctx, {
    repositoryId: input.repositoryId,
    type: input.targetType,
    title: input.title,
    body: input.body,
    priority: input.priority,
    sourceType: "manual",
    sourceRef: input.memoId
  });
  const memo = updateWorkItemStatus(ctx, input.memoId, "itemized");

  return { item, memo };
}

