export const LOCAL_USER_ID = "local-user";
export const PERSONAL_WORKSPACE_ID = "personal-workspace";

export type LocalContext = {
  user: {
    id: typeof LOCAL_USER_ID;
    email: null;
    displayName: "Local user";
  };
  workspace: {
    id: typeof PERSONAL_WORKSPACE_ID;
    name: "Personal workspace";
  };
};

export async function requireLocalContext(): Promise<LocalContext> {
  return {
    user: {
      id: LOCAL_USER_ID,
      email: null,
      displayName: "Local user"
    },
    workspace: {
      id: PERSONAL_WORKSPACE_ID,
      name: "Personal workspace"
    }
  };
}
