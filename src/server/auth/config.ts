export const SESSION_COOKIE_NAME = "nextpatch_session";
export const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthConfig = {
  loginPassword: string;
  sessionSecret: string;
  sessionMaxAgeSeconds: number;
  cookieSecure: boolean;
};

export function getAuthConfig(): AuthConfig | null {
  const loginPassword = process.env.NEXTPATCH_LOGIN_PASSWORD;
  const sessionSecret = process.env.NEXTPATCH_SESSION_SECRET;

  if (!loginPassword || !sessionSecret) {
    return null;
  }

  const sessionMaxAgeSeconds = parsePositiveInteger(
    process.env.NEXTPATCH_SESSION_MAX_AGE_SECONDS,
    DEFAULT_SESSION_MAX_AGE_SECONDS
  );

  return {
    loginPassword,
    sessionSecret,
    sessionMaxAgeSeconds,
    cookieSecure: process.env.NEXTPATCH_COOKIE_SECURE === "true"
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}
