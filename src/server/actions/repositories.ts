"use server";

import { requireLocalContext } from "@/server/auth/session";
import { archiveRepositoryCommand, createRepositoryCommand, updateRepositoryFocusCommand } from "@/server/db/queries/repositories";
import { parseGitHubUrl } from "@/server/domain/github-url";
import { repositorySchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

export type RepositoryFormState = {
  error: string | null;
};

type RepositoryFormInput = z.infer<typeof repositorySchema>;

export async function createRepository(formData: FormData) {
  const id = await createRepositoryFromFormData(formData);

  revalidatePath("/repositories");
  redirect(`/repositories/${id}`);
}

export async function createRepositoryWithState(_previousState: RepositoryFormState, formData: FormData): Promise<RepositoryFormState> {
  const parsedResult = repositorySchema.safeParse(repositoryFormDataToInput(formData));
  if (!parsedResult.success) {
    return { error: parsedResult.error.issues.map((issue) => issue.message).join(" ") };
  }

  const id = await createRepositoryFromParsed(parsedResult.data);

  revalidatePath("/repositories");
  redirect(`/repositories/${id}`);
}

async function createRepositoryFromFormData(formData: FormData) {
  const parsed = repositorySchema.parse(repositoryFormDataToInput(formData));
  return createRepositoryFromParsed(parsed);
}

async function createRepositoryFromParsed(parsed: RepositoryFormInput) {
  const { user, workspace } = await requireLocalContext();

  const github = parsed.htmlUrl ? parseGitHubUrl(parsed.htmlUrl) : null;

  return createRepositoryCommand({
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
}

function repositoryFormDataToInput(formData: FormData) {
  return {
    name: formData.get("name"),
    htmlUrl: formData.get("htmlUrl") || undefined,
    description: formData.get("description") || undefined,
    productionStatus: formData.get("productionStatus") || "development",
    criticality: formData.get("criticality") || "medium",
    currentFocus: formData.get("currentFocus") || undefined
  };
}

export async function updateRepositoryFocus(formData: FormData) {
  const { workspace } = await requireLocalContext();
  const id = String(formData.get("id") ?? "");
  const currentFocus = String(formData.get("currentFocus") ?? "").trim();

  if (!id) {
    throw new Error("Repository id is required");
  }

  await updateRepositoryFocusCommand(workspace.id, id, currentFocus.length > 0 ? currentFocus : null);

  revalidatePath("/repositories");
  revalidatePath(`/repositories/${id}`);
  redirect(`/repositories/${id}`);
}

export async function archiveRepository(formData: FormData) {
  const { workspace } = await requireLocalContext();
  const id = String(formData.get("id") ?? "");

  await archiveRepositoryCommand(workspace.id, id);

  revalidatePath("/repositories");
  redirect("/repositories");
}
