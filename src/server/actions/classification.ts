"use server";

import { throwSqlitePersistencePending } from "@/server/auth/session";
import { classifyMemoSchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";

export async function classifyMemo(formData: FormData) {
  classifyMemoSchema.parse({
    memoId: formData.get("memoId"),
    targetType: formData.get("targetType"),
    repositoryId: formData.get("repositoryId") || "",
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    priority: formData.get("priority") || "p2"
  });

  revalidatePath("/inbox");
  revalidatePath("/work-items");
  throwSqlitePersistencePending();
}
