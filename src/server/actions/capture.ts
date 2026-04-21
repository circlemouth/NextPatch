"use server";

import { requireLocalContext } from "@/server/auth/session";
import { createCapturedWorkItem } from "@/server/db/queries/work-items";
import { parseImportContent } from "@/server/domain/import-parser";
import { quickCaptureSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function quickCapture(formData: FormData) {
  const { user, workspace } = await requireLocalContext();
  const parsed = quickCaptureSchema.parse({
    repositoryId: formData.get("repositoryId") || "",
    type: formData.get("type") || "auto",
    title: formData.get("title") || undefined,
    body: formData.get("body"),
    privacyLevel: formData.get("privacyLevel") || "normal",
    isPinned: formData.get("isPinned") === "on",
    sourceType: formData.get("sourceType") || "manual"
  });
  const type = parsed.type === "auto" ? "memo" : parsed.type;
  const repositoryId = parsed.repositoryId || null;
  const scope = repositoryId ? "repository" : type === "memo" ? "inbox" : "global";
  const title = parsed.title || firstLine(parsed.body);
  const importResult = parseImportContent(parsed.body);

  await createCapturedWorkItem(
    {
      workspaceId: workspace.id,
      userId: user.id,
      repositoryId,
      scope,
      type,
      title,
      body: parsed.body,
      status: type === "memo" ? "unreviewed" : "todo",
      priority: "p2",
      sourceType: parsed.sourceType === "chatgpt" ? "chatgpt" : "manual",
      privacyLevel: parsed.privacyLevel,
      isPinned: parsed.isPinned
    },
    importResult.candidates.map((candidate) => ({
      targetType: candidate.targetType,
      title: candidate.title,
      body: candidate.body,
      confidence: candidate.confidence,
      parseSource: importResult.format,
      parseError: importResult.error ?? null
    }))
  );

  revalidatePath("/dashboard");
  revalidatePath("/inbox");
  redirect(type === "memo" ? "/inbox" : "/work-items");
}

function firstLine(value: string) {
  return value.split(/\r?\n/).find(Boolean)?.slice(0, 80) || "Untitled memo";
}
