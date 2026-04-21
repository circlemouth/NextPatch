import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  claimsToLocalContext,
  createSessionToken,
  getAuthConfig,
  safeNextPath,
  verifySessionToken,
  type AuthConfig,
  type LocalContext,
  type SessionClaims,
  LOCAL_USER_ID,
  PERSONAL_WORKSPACE_ID
} from "./core";

export { AUTH_COOKIE_NAME, createSessionToken, getAuthConfig, safeNextPath, verifySessionToken, LOCAL_USER_ID, PERSONAL_WORKSPACE_ID };
export type { AuthConfig, LocalContext, SessionClaims };

export async function getOptionalLocalContext(): Promise<LocalContext | null> {
  if (process.env.NODE_ENV === "test") {
    return createFallbackContext();
  }

  let config: ReturnType<typeof getAuthConfig> | undefined;
  try {
    config = getAuthConfig();
  } catch {
    return null;
  }

  if (!config) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const claims = verifySessionToken(token, { config });
  if (!claims) {
    return null;
  }

  return claimsToLocalContext(claims);
}

export async function requireLocalContext(): Promise<LocalContext> {
  const context = await getOptionalLocalContext();
  if (!context) {
    redirect("/login");
  }

  return context;
}

function createFallbackContext(): LocalContext {
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
