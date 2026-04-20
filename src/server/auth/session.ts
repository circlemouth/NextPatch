import { createServerSupabaseClient } from "@/server/supabase/server";
import { redirect } from "next/navigation";

export async function requireSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const workspace = await ensurePersonalWorkspace(user.id);

  return { supabase, user, workspace };
}

async function ensurePersonalWorkspace(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(id, name)")
    .eq("user_id", userId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.workspace_id) {
    return {
      id: existing.workspace_id,
      name: "Personal workspace"
    };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ name: "Personal workspace", owner_user_id: userId })
    .select("id, name")
    .single();

  if (workspaceError) {
    throw workspaceError;
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: "owner"
  });

  if (memberError) {
    throw memberError;
  }

  return workspace;
}
