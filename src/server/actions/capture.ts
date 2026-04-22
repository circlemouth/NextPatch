"use server";

import { requireLocalContext } from "@/server/auth/session";
import { quickCaptureCommand } from "@/server/db/queries/classification";
import { parseImportContent } from "@/server/domain/import-parser";
import { quickCaptureSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function quickCapture(formData: FormData) {
  const { user, workspace } = await requireLocalContext();
  const parsedResult = quickCaptureSchema.safeParse({
    repositoryId: formData.get("repositoryId") || "",
    type: formData.get("type") || "auto",
    title: formData.get("title") || undefined,
    body: formData.get("body"),
    privacyLevel: formData.get("privacyLevel") || "normal",
    isPinned: formData.get("isPinned") === "on",
    sourceType: formData.get("sourceType") || "manual"
  });
  if (!parsedResult.success) {
    throw new Error(parsedResult.error.issues.map((issue) => issue.message).join(" "));
  }
  const parsed = parsedResult.data;
  const type = parsed.type === "auto" ? "memo" : parsed.type;
  const repositoryId = parsed.repositoryId || null;
  const scope = repositoryId ? "repository" : type === "memo" ? "inbox" : "global";
  const title = parsed.title || firstLine(parsed.body);
  const importResult = parseImportContent(parsed.body);

  await quickCaptureCommand({
    workspaceId: workspace.id,
    userId: user.id,
    repositoryId,
    scope,
    type,
    title,
    body: parsed.body,
    sourceType: parsed.sourceType === "chatgpt" ? "chatgpt" : "manual",
    privacyLevel: parsed.privacyLevel,
    isPinned: parsed.isPinned,
    importResult
  });

  revalidatePath("/repositories");
  revalidatePath("/work-items");
  revalidatePath("/inbox");
  if (repositoryId) {
    revalidatePath(`/repositories/${repositoryId}`);
    redirect(`/repositories/${repositoryId}`);
  }

  redirect("/repositories");
}

function firstLine(value: string) {
  return value.split(/\r?\n/).find(Boolean)?.slice(0, 80) || "Untitled memo";
}
