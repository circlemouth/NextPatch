"use server";

import { requireSession } from "@/server/auth/session";
import { parseGitHubUrl } from "@/server/domain/github-url";
import { repositorySchema } from "@/server/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRepository(formData: FormData) {
  const { supabase, user, workspace } = await requireSession();
  const parsed = repositorySchema.parse({
    name: formData.get("name"),
    htmlUrl: formData.get("htmlUrl") || undefined,
    description: formData.get("description") || undefined,
    productionStatus: formData.get("productionStatus") || "development",
    criticality: formData.get("criticality") || "medium",
    currentFocus: formData.get("currentFocus") || undefined
  });
  const github = parsed.htmlUrl ? parseGitHubUrl(parsed.htmlUrl) : null;

  const { data, error } = await supabase
    .from("repositories")
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      provider: github ? "github" : "manual",
      name: parsed.name,
      description: parsed.description || null,
      html_url: github?.canonicalUrl ?? parsed.htmlUrl ?? null,
      github_host: github?.githubHost ?? null,
      github_owner: github?.githubOwner ?? null,
      github_repo: github?.githubRepo ?? null,
      github_full_name: github?.githubFullName ?? null,
      production_status: parsed.productionStatus,
      criticality: parsed.criticality,
      current_focus: parsed.currentFocus || null
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  revalidatePath("/repositories");
  redirect(`/repositories/${data.id}`);
}

export async function archiveRepository(formData: FormData) {
  const { supabase, workspace } = await requireSession();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase
    .from("repositories")
    .update({ archived_at: new Date().toISOString() })
    .eq("workspace_id", workspace.id)
    .eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePath("/repositories");
}
