export type LocalUser = {
  id: "local-user";
  email: null;
  displayName: "Local user";
};

export type LocalWorkspace = {
  id: "personal-workspace";
  name: "Personal workspace";
};

export type LocalContext = {
  user: LocalUser;
  workspace: LocalWorkspace;
};

const localContext: LocalContext = {
  user: {
    id: "local-user",
    email: null,
    displayName: "Local user"
  },
  workspace: {
    id: "personal-workspace",
    name: "Personal workspace"
  }
};

export async function requireLocalContext() {
  return localContext;
}

export async function requireSession() {
  return requireLocalContext();
}

export function throwSqlitePersistencePending(): never {
  throw new Error("SQLite persistence is not implemented in this migration slice yet.");
}
