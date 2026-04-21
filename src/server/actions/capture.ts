"use server";

import { throwSqlitePersistencePending } from "@/server/auth/session";
import { quickCaptureSchema } from "@/server/validation/schemas";

export async function quickCapture(formData: FormData) {
  quickCaptureSchema.parse({
    repositoryId: formData.get("repositoryId") || "",
    type: formData.get("type") || "auto",
    title: formData.get("title") || undefined,
    body: formData.get("body"),
    privacyLevel: formData.get("privacyLevel") || "normal",
    isPinned: formData.get("isPinned") === "on",
    sourceType: formData.get("sourceType") || "manual"
  });

  throwSqlitePersistencePending();
}
