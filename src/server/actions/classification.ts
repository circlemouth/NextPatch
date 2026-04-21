"use server";

import { requireSession } from "@/server/auth/session";
import { createWorkItem, updateWorkItemStatus } from "@/server/db/queries/context";
import { defaultStatus } from "@/server/domain/work-item-defaults";
import { classifyMemoSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function classifyMemo(formData: FormData) {
  const { user, workspace } = await requireSession();
  const parsed = classifyMemoSchema.parse({
    memoId: formData.get("memoId"),
    targetType: formData.get("targetType"),
    repositoryId: formData.get("repositoryId") || "",
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    priority: formData.get("priority") || "p2"
  });
  const repositoryId = parsed.repositoryId || null;

  createWorkItem({
    workspace_id: workspace.id,
    user_id: user.id,
    repository_id: repositoryId,
    scope: repositoryId ? "repository" : "global",
    type: parsed.targetType,
    title: parsed.title,
    body: parsed.body || null,
    status: defaultStatus(parsed.targetType),
    priority: parsed.priority,
    source_type: "manual",
    source_ref: parsed.memoId,
    privacy_level: "normal"
  });

  const closedAt = new Date().toISOString();
  updateWorkItemStatus(workspace.id, parsed.memoId, "itemized", { completed_at: closedAt, closed_at: closedAt });

  revalidatePath("/inbox");
  revalidatePath("/work-items");
  redirect("/inbox");
}
