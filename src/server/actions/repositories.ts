"use server";

import { throwSqlitePersistencePending } from "@/server/auth/session";
import { repositorySchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";

export async function createRepository(formData: FormData) {
  repositorySchema.parse({
    name: formData.get("name"),
    htmlUrl: formData.get("htmlUrl") || undefined,
    description: formData.get("description") || undefined,
    productionStatus: formData.get("productionStatus") || "development",
    criticality: formData.get("criticality") || "medium",
    currentFocus: formData.get("currentFocus") || undefined
  });

  throwSqlitePersistencePending();
}

export async function archiveRepository(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) throw new Error("Repository id is required.");

  revalidatePath("/repositories");
  throwSqlitePersistencePending();
}
