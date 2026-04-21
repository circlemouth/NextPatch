"use server";

import { requireLocalContext } from "@/server/auth/session";
import { classifyMemoCommand } from "@/server/db/queries/classification";
import { classifyMemoSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function classifyMemo(formData: FormData) {
  const { user, workspace } = await requireLocalContext();
  const parsedResult = classifyMemoSchema.safeParse({
    memoId: formData.get("memoId"),
    targetType: formData.get("targetType"),
    repositoryId: formData.get("repositoryId") || "",
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    priority: formData.get("priority") || "p2"
  });
  if (!parsedResult.success) {
    throw new Error(parsedResult.error.issues.map((issue) => issue.message).join(" "));
  }
  const parsed = parsedResult.data;
  const repositoryId = parsed.repositoryId || null;

  await classifyMemoCommand({
    workspaceId: workspace.id,
    userId: user.id,
    memoId: parsed.memoId,
    repositoryId,
    targetType: parsed.targetType,
    title: parsed.title,
    body: parsed.body || null,
    priority: parsed.priority
  });

  revalidatePath("/inbox");
  revalidatePath("/work-items");
  redirect("/inbox");
}
