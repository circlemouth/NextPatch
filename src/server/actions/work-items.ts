"use server";

import { requireLocalContext } from "@/server/auth/session";
import { createWorkItemCommand, getWorkItemById, updateWorkItemStatusCommand } from "@/server/db/queries/work-items";
import { defaultStatus } from "@/server/domain/work-item-defaults";
import { titleFromBody } from "@/server/domain/work-item-title";
import { workItemSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

export type WorkItemFormState = {
  error: string | null;
};

type WorkItemFormInput = z.infer<typeof workItemSchema>;

export async function createWorkItem(formData: FormData) {
  const parsed = workItemSchema.parse(workItemFormDataToInput(formData));
  await createWorkItemFromParsed(parsed);
}

export async function createWorkItemWithState(_previousState: WorkItemFormState, formData: FormData): Promise<WorkItemFormState> {
  const parsedResult = workItemSchema.safeParse(workItemFormDataToInput(formData));
  if (!parsedResult.success) {
    return { error: parsedResult.error.issues.map((issue) => issue.message).join(" ") };
  }

  await createWorkItemFromParsed(parsedResult.data);
  return { error: null };
}

async function createWorkItemFromParsed(parsed: WorkItemFormInput) {
  const { user, workspace } = await requireLocalContext();

  const repositoryId = parsed.repositoryId || null;
  const body = parsed.body.trim();
  const title = parsed.title?.trim() || titleFromBody(body);
  const scope = repositoryId ? "repository" : parsed.type === "memo" ? "inbox" : "global";

  await createWorkItemCommand({
    workspaceId: workspace.id,
    userId: user.id,
    repositoryId,
    scope,
    type: parsed.type,
    title,
    body,
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
  if (repositoryId) {
    revalidatePath(`/repositories/${repositoryId}`);
    redirect(`/repositories/${repositoryId}`);
  }

  redirect("/repositories");
}

function workItemFormDataToInput(formData: FormData) {
  return {
    repositoryId: formData.get("repositoryId") || "",
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    priority: formData.get("priority") || "p2",
    privacyLevel: formData.get("privacyLevel") || "normal",
    isPinned: formData.get("isPinned") === "on",
    externalUrl: formData.get("externalUrl") || undefined
  };
}

export async function updateWorkItemStatus(formData: FormData) {
  const { user, workspace } = await requireLocalContext();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) {
    throw new Error("Work item status update requires id and status");
  }
  const item = await getWorkItemById(workspace.id, id);
  await updateWorkItemStatusCommand(workspace.id, user.id, id, status);

  revalidatePath("/repositories");
  revalidatePath("/work-items");
  if (item?.repository_id) {
    revalidatePath(`/repositories/${item.repository_id}`);
  }
}
