import { PERSONAL_WORKSPACE_ID } from "@/server/auth/session";

export function assertPersonalWorkspaceScope(workspaceId: string) {
  if (workspaceId !== PERSONAL_WORKSPACE_ID) {
    throw new Error(`Unsupported workspace scope: ${workspaceId}`);
  }
}
