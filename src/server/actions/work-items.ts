"use server";

import { requireSession } from "@/server/auth/session";
import { applyStatusTimestamps } from "@/server/domain/status";
import { defaultStatus } from "@/server/domain/work-item-defaults";
import { workItemSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createWorkItem(formData: FormData) {
  const { supabase, user, workspace } = await requireSession();
  const parsed = workItemSchema.parse({
    repositoryId: formData.get("repositoryId") || "",
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    priority: formData.get("priority") || "p2",
    privacyLevel: formData.get("privacyLevel") || "normal",
    isPinned: formData.get("isPinned") === "on",
    externalUrl: formData.get("externalUrl") || undefined
  });
  const repositoryId = parsed.repositoryId || null;
  const scope = repositoryId ? "repository" : parsed.type === "memo" ? "inbox" : "global";

  const { data, error } = await supabase
    .from("work_items")
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      repository_id: repositoryId,
      scope,
      type: parsed.type,
      title: parsed.title,
      body: parsed.body || null,
      status: defaultStatus(parsed.type),
      priority: parsed.priority,
      source_type: "manual",
      privacy_level: parsed.privacyLevel,
      is_pinned: parsed.isPinned,
      external_url: parsed.externalUrl || null,
      external_provider: parsed.externalUrl?.includes("github.com") ? "github" : null
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/work-items");
  redirect(`/work-items/${data.id}`);
}

export async function updateWorkItemStatus(formData: FormData) {
  const { supabase, user, workspace } = await requireSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const { data: item, error: itemError } = await supabase
    .from("work_items")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("id", id)
    .single();

  if (itemError) {
    throw itemError;
  }

  const timestamps = applyStatusTimestamps(item, status);
  const { error } = await supabase
    .from("work_items")
    .update({ status, ...timestamps })
    .eq("workspace_id", workspace.id)
    .eq("id", id);

  if (error) {
    throw error;
  }

  await supabase.from("status_histories").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    work_item_id: id,
    from_status: item.status,
    to_status: status
  });

  revalidatePath("/dashboard");
  revalidatePath("/work-items");
}
