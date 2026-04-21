import { getAuthConfig, SESSION_COOKIE_NAME } from "@/server/auth/config";
import { verifySessionToken } from "@/server/auth/session-token";

export async function hasAuthenticatedLocalSession(cookieHeader: string | null | undefined): Promise<boolean> {
  const config = getAuthConfig();
  if (!config) {
    return false;
  }

  const token = readCookieValue(cookieHeader, SESSION_COOKIE_NAME);
  if (!token) {
    return false;
  }

  return (await verifySessionToken(token, config.sessionSecret)) !== null;
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
