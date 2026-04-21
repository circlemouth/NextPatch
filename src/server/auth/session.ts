import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthConfig, SESSION_COOKIE_NAME } from "@/server/auth/config";
import { getLoginPath } from "@/server/auth/redirects";
import { verifySessionToken } from "@/server/auth/session-token";

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

const LOCAL_CONTEXT: LocalContext = {
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

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export async function getAuthenticatedLocalContext(): Promise<LocalContext | null> {
  const config = getAuthConfig();
  if (!config) {
    return null;
  }

  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    return null;
  }

  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getAuthenticatedLocalContextFromToken(token, config.sessionSecret);
}

export async function getAuthenticatedLocalContextFromCookieHeader(cookieHeader: string | null | undefined): Promise<LocalContext | null> {
  const config = getAuthConfig();
  if (!config) {
    return null;
  }

  const token = readCookieValue(cookieHeader, SESSION_COOKIE_NAME);
  return getAuthenticatedLocalContextFromToken(token, config.sessionSecret);
}

export async function requireLocalContext(): Promise<LocalContext> {
  const context = await getAuthenticatedLocalContext();
  if (!context) {
    throw new UnauthorizedError();
  }

  return context;
}

export async function requireLocalContextForPage(nextPath?: string): Promise<LocalContext> {
  const context = await getAuthenticatedLocalContext();
  if (!context) {
    redirect(getLoginPath(nextPath));
  }

  return context;
}

async function getAuthenticatedLocalContextFromToken(token: string | undefined, sessionSecret: string) {
  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token, sessionSecret);
  if (!session) {
    return null;
  }

  return LOCAL_CONTEXT;
}

function readCookieValue(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) {
    return undefined;
  }

  for (const entry of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = entry.split("=");
    if (rawName?.trim() === name) {
      return rawValue.join("=").trim();
    }
  }

  return undefined;
}
