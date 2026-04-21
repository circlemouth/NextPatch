"use server";

import { throwSqlitePersistencePending } from "@/server/auth/session";
import { workItemSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";

export async function createWorkItem(formData: FormData) {
  workItemSchema.parse({
    repositoryId: formData.get("repositoryId") || "",
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    priority: formData.get("priority") || "p2",
    privacyLevel: formData.get("privacyLevel") || "normal",
    isPinned: formData.get("isPinned") === "on",
    externalUrl: formData.get("externalUrl") || undefined
  });

  throwSqlitePersistencePending();
}

export async function updateWorkItemStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !status) throw new Error("Work item id and status are required.");

  revalidatePath("/dashboard");
  revalidatePath("/work-items");
  throwSqlitePersistencePending();
}
