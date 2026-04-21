import type { NextPatchDatabase } from "@/server/db/client";

export const LOCAL_USER_ID = "local-user";
export const PERSONAL_WORKSPACE_ID = "personal-workspace";

export type QueryContext = {
  db: NextPatchDatabase;
  userId: string;
  workspaceId: string;
};

export function createQueryContext(
  db: NextPatchDatabase,
  overrides: Partial<Pick<QueryContext, "userId" | "workspaceId">> = {}
): QueryContext {
  return {
    db,
    userId: overrides.userId ?? LOCAL_USER_ID,
    workspaceId: overrides.workspaceId ?? PERSONAL_WORKSPACE_ID
  };
}

