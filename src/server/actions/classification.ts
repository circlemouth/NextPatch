"use server";

import { requireLocalContext } from "@/server/auth/session";
import { classifyMemoRecord } from "@/server/db/queries/work-items";
import { defaultStatus } from "@/server/domain/work-item-defaults";
import { classifyMemoSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function classifyMemo(formData: FormData) {
  const { user, workspace } = await requireLocalContext();
  const parsed = classifyMemoSchema.parse({
    memoId: formData.get("memoId"),
    targetType: formData.get("targetType"),
    repositoryId: formData.get("repositoryId") || "",
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    priority: formData.get("priority") || "p2"
  });
  const repositoryId = parsed.repositoryId || null;

  await classifyMemoRecord({
    workspaceId: workspace.id,
    userId: user.id,
    memoId: parsed.memoId,
    repositoryId,
    scope: repositoryId ? "repository" : "global",
    type: parsed.targetType,
    title: parsed.title,
    body: parsed.body || null,
    status: defaultStatus(parsed.targetType),
    priority: parsed.priority,
    sourceType: "manual",
    sourceRef: parsed.memoId,
    privacyLevel: "normal"
  });

  revalidatePath("/inbox");
  revalidatePath("/work-items");
  redirect("/inbox");
}
