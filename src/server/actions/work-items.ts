"use server";

import { requireSession } from "@/server/auth/session";
import {
  createWorkItem as insertWorkItem,
  getWorkItem,
  insertStatusHistory,
  updateWorkItemStatus as persistWorkItemStatus
} from "@/server/db/queries/context";
import { applyStatusTimestamps } from "@/server/domain/status";
import { defaultStatus } from "@/server/domain/work-item-defaults";
import { workItemSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createWorkItem(formData: FormData) {
  const { user, workspace } = await requireSession();
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

  const item = insertWorkItem({
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
  });

  revalidatePath("/work-items");
  redirect(`/work-items/${item.id}`);
}

export async function updateWorkItemStatus(formData: FormData) {
  const { user, workspace } = await requireSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const item = getWorkItem(workspace.id, id);

  const timestamps = applyStatusTimestamps(item, status);
  persistWorkItemStatus(workspace.id, id, status, timestamps);
  insertStatusHistory({
    workspace_id: workspace.id,
    user_id: user.id,
    work_item_id: id,
    from_status: item.status,
    to_status: status
  });

  revalidatePath("/dashboard");
  revalidatePath("/work-items");
}
