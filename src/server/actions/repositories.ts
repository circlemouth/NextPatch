"use server";

import { requireLocalContext } from "@/server/auth/session";
import { archiveRepositoryRecord, createRepositoryRecord } from "@/server/db/queries/repositories";
import { parseGitHubUrl } from "@/server/domain/github-url";
import { repositorySchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRepository(formData: FormData) {
  const { user, workspace } = await requireLocalContext();
  const parsed = repositorySchema.parse({
    name: formData.get("name"),
    htmlUrl: formData.get("htmlUrl") || undefined,
    description: formData.get("description") || undefined,
    productionStatus: formData.get("productionStatus") || "development",
    criticality: formData.get("criticality") || "medium",
    currentFocus: formData.get("currentFocus") || undefined
  });
  const github = parsed.htmlUrl ? parseGitHubUrl(parsed.htmlUrl) : null;

  const id = await createRepositoryRecord({
    workspaceId: workspace.id,
    userId: user.id,
    provider: github ? "github" : "manual",
    name: parsed.name,
    description: parsed.description || null,
    htmlUrl: github?.canonicalUrl ?? parsed.htmlUrl ?? null,
    githubHost: github?.githubHost ?? null,
    githubOwner: github?.githubOwner ?? null,
    githubRepo: github?.githubRepo ?? null,
    githubFullName: github?.githubFullName ?? null,
    productionStatus: parsed.productionStatus,
    criticality: parsed.criticality,
    currentFocus: parsed.currentFocus || null
  });

  revalidatePath("/repositories");
  redirect(`/repositories/${id}`);
}

export async function archiveRepository(formData: FormData) {
  const { workspace } = await requireLocalContext();
  const id = String(formData.get("id") ?? "");
  await archiveRepositoryRecord(workspace.id, id);

  revalidatePath("/repositories");
}
