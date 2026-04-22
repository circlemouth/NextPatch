"use server";

import { requireLocalContext } from "@/server/auth/session";
import { createWorkItemCommand, updateWorkItemStatusCommand } from "@/server/db/queries/work-items";
import { defaultStatus } from "@/server/domain/work-item-defaults";
import { workItemSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createWorkItem(formData: FormData) {
  const { user, workspace } = await requireLocalContext();
  const parsedResult = workItemSchema.safeParse({
    repositoryId: formData.get("repositoryId") || "",
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    priority: formData.get("priority") || "p2",
    privacyLevel: formData.get("privacyLevel") || "normal",
    isPinned: formData.get("isPinned") === "on",
    externalUrl: formData.get("externalUrl") || undefined
  });
  if (!parsedResult.success) {
    throw new Error(parsedResult.error.issues.map((issue) => issue.message).join(" "));
  }
  const parsed = parsedResult.data;
  const repositoryId = parsed.repositoryId || null;
  const title = parsed.title?.trim() || firstLine(parsed.body);
  if (!title) {
    throw new Error("Title or body is required");
  }

  const scope = repositoryId ? "repository" : parsed.type === "memo" ? "inbox" : "global";

  await createWorkItemCommand({
    workspaceId: workspace.id,
    userId: user.id,
    repositoryId,
    scope,
    type: parsed.type,
    title,
    body: parsed.body || null,
    status: defaultStatus(parsed.type),
    priority: parsed.priority,
    sourceType: "manual",
    privacyLevel: parsed.privacyLevel,
    isPinned: parsed.isPinned,
    externalUrl: parsed.externalUrl || null,
    externalProvider: parsed.externalUrl?.includes("github.com") ? "github" : null
  });

  revalidatePath("/repositories");
  revalidatePath("/work-items");
  const redirectPath = repositoryId ? `/repositories/${repositoryId}` : "/repositories";
  if (repositoryId) {
    revalidatePath(`/repositories/${repositoryId}`);
  }

  redirect(redirectPath);
}

export async function updateWorkItemStatus(formData: FormData) {
  const { user, workspace } = await requireLocalContext();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) {
    throw new Error("Work item status update requires id and status");
  }
  await updateWorkItemStatusCommand(workspace.id, user.id, id, status);

  revalidatePath("/dashboard");
  revalidatePath("/work-items");
}

function firstLine(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.split(/\r?\n/).find(Boolean)?.slice(0, 80) || "";
}
