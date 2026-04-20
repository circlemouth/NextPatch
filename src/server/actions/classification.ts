"use server";

import { requireSession } from "@/server/auth/session";
import { defaultStatus } from "@/server/domain/work-item-defaults";
import { classifyMemoSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function classifyMemo(formData: FormData) {
  const { supabase, user, workspace } = await requireSession();
  const parsed = classifyMemoSchema.parse({
    memoId: formData.get("memoId"),
    targetType: formData.get("targetType"),
    repositoryId: formData.get("repositoryId") || "",
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    priority: formData.get("priority") || "p2"
  });
  const repositoryId = parsed.repositoryId || null;

  const { error: createError } = await supabase.from("work_items").insert({
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

  if (createError) {
    throw createError;
  }

  const { error: updateError } = await supabase
    .from("work_items")
    .update({ status: "itemized", completed_at: new Date().toISOString(), closed_at: new Date().toISOString() })
    .eq("workspace_id", workspace.id)
    .eq("id", parsed.memoId);

  if (updateError) {
    throw updateError;
  }

  revalidatePath("/inbox");
  revalidatePath("/work-items");
  redirect("/inbox");
}
