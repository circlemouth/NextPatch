import crypto from "node:crypto";

export const LOCAL_USER_ID = "local-user";
export const PERSONAL_WORKSPACE_ID = "personal-workspace";
export const AUTH_COOKIE_NAME = "nextpatch.session";
export const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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

export type AuthConfig = {
  loginPassword: string;
  sessionSecret: string;
  sessionMaxAgeSeconds: number;
};

export type SessionClaims = {
  userId: typeof LOCAL_USER_ID;
  workspaceId: typeof PERSONAL_WORKSPACE_ID;
  iat: number;
  exp: number;
};

export function getAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const loginPassword = env.NEXTPATCH_LOGIN_PASSWORD?.trim();
  const sessionSecret = env.NEXTPATCH_SESSION_SECRET?.trim();
  const missing: string[] = [];

  if (!loginPassword) {
    missing.push("NEXTPATCH_LOGIN_PASSWORD");
  }

  if (!sessionSecret) {
    missing.push("NEXTPATCH_SESSION_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(`Missing auth configuration: ${missing.join(", ")}`);
  }

  return {
    loginPassword: loginPassword as string,
    sessionSecret: sessionSecret as string,
    sessionMaxAgeSeconds: DEFAULT_SESSION_MAX_AGE_SECONDS
  };
}

export function createSessionToken(input: {
  config: AuthConfig;
  now?: number;
  userId?: typeof LOCAL_USER_ID;
  workspaceId?: typeof PERSONAL_WORKSPACE_ID;
}): string {
  const now = input.now ?? Date.now();
  const issuedAt = Math.floor(now / 1000);
  const claims: SessionClaims = {
    userId: input.userId ?? LOCAL_USER_ID,
    workspaceId: input.workspaceId ?? PERSONAL_WORKSPACE_ID,
    iat: issuedAt,
    exp: issuedAt + input.config.sessionMaxAgeSeconds
  };

  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `v1.${payload}.${sign(payload, input.config.sessionSecret)}`;
}

export function verifySessionToken(
  token: string,
  input: {
    config: AuthConfig;
    now?: number;
  }
): SessionClaims | null {
  const [version, payloadPart, signature] = token.split(".");

  if (version !== "v1" || !payloadPart || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadPart, input.config.sessionSecret);
  if (!isTimingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as Partial<SessionClaims>;
    if (parsed.userId !== LOCAL_USER_ID || parsed.workspaceId !== PERSONAL_WORKSPACE_ID) {
      return null;
    }
    if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number") {
      return null;
    }

    const now = Math.floor((input.now ?? Date.now()) / 1000);
    if (parsed.exp <= now) {
      return null;
    }

    return {
      userId: parsed.userId,
      workspaceId: parsed.workspaceId,
      iat: parsed.iat,
      exp: parsed.exp
    };
  } catch {
    return null;
  }
}

export function claimsToLocalContext(claims: SessionClaims): LocalContext | null {
  if (claims.userId !== LOCAL_USER_ID || claims.workspaceId !== PERSONAL_WORKSPACE_ID) {
    return null;
  }

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

export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  const candidate = typeof next === "string" ? next.trim() : "";
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(candidate, "http://nextpatch.local");
    if (url.origin !== "http://nextpatch.local") {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    return fallback;
  }
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function isTimingSafeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBytes, rightBytes);
}
