import { getDb } from "@/server/db/client";

export type LocalUser = {
  id: "local-user";
  email: null;
  displayName: "Local user";
};

export type LocalWorkspace = {
  id: "personal-workspace";
  name: string;
};

type WorkspaceRow = {
  id: "personal-workspace";
  name: string;
};

export function getLocalContext() {
  const db = getDb();
  const workspace = db
    .prepare("select id, name from workspaces where id = ?")
    .get("personal-workspace") as WorkspaceRow | undefined;

  if (!workspace) {
    throw new Error("Local workspace seed is missing.");
  }

  return {
    user: {
      id: "local-user",
      email: null,
      displayName: "Local user"
    } satisfies LocalUser,
    workspace: {
      id: workspace.id,
      name: workspace.name
    } satisfies LocalWorkspace
  };
}
