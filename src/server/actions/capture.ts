"use server";

import { requireSession } from "@/server/auth/session";
import { createClassificationCandidates, createWorkItem } from "@/server/db/queries/context";
import { parseImportContent } from "@/server/domain/import-parser";
import { quickCaptureSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function quickCapture(formData: FormData) {
  const { user, workspace } = await requireSession();
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

  const memo = createWorkItem({
    workspace_id: workspace.id,
    user_id: user.id,
    repository_id: repositoryId,
    scope,
    type,
    title,
    body: parsed.body,
    status: type === "memo" ? "unreviewed" : "todo",
    priority: "p2",
    source_type: parsed.sourceType === "chatgpt" ? "chatgpt" : "manual",
    privacy_level: parsed.privacyLevel,
    is_pinned: parsed.isPinned
  });

  if (importResult.candidates.length > 0) {
    createClassificationCandidates(
      importResult.candidates.map((candidate) => ({
        workspace_id: workspace.id,
        user_id: user.id,
        memo_work_item_id: memo.id,
        target_type: candidate.targetType,
        title: candidate.title,
        body: candidate.body,
        confidence: candidate.confidence,
        parse_source: importResult.format,
        parse_error: importResult.error ?? null
      }))
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/inbox");
  redirect(type === "memo" ? "/inbox" : "/work-items");
}

function firstLine(value: string) {
  return value.split(/\r?\n/).find(Boolean)?.slice(0, 80) || "Untitled memo";
}
