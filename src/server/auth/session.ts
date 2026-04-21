import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const LOCAL_USER_ID = "local-user";
export const PERSONAL_WORKSPACE_ID = "personal-workspace";
const AUTH_COOKIE_NAME = "nextpatch-session";
const AUTH_SESSION_VERSION = "v1";

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

function getAuthConfig() {
  const loginPassword = process.env.NEXTPATCH_LOGIN_PASSWORD;
  const sessionSecret = process.env.NEXTPATCH_SESSION_SECRET;

  if (!loginPassword || !sessionSecret) {
    return null;
  }

  return { loginPassword, sessionSecret };
}

function signSessionPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionValue(secret: string) {
  const payload = `${AUTH_SESSION_VERSION}:${LOCAL_USER_ID}:${PERSONAL_WORKSPACE_ID}`;
  const signature = signSessionPayload(payload, secret);
  return `${payload}.${signature}`;
}

async function readValidSession() {
  const authConfig = getAuthConfig();

  if (!authConfig) {
    redirect("/login?error=missing-config");
  }

  const cookieStore = await cookies();
  const rawSession = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!rawSession) {
    redirect("/login");
  }

  const [payload, signature] = rawSession.split(".");
  if (!payload || !signature) {
    redirect("/login");
  }

  const expectedSignature = signSessionPayload(payload, authConfig.sessionSecret);
  if (signature !== expectedSignature) {
    redirect("/login");
  }

  const expectedPayload = `${AUTH_SESSION_VERSION}:${LOCAL_USER_ID}:${PERSONAL_WORKSPACE_ID}`;
  if (payload !== expectedPayload) {
    redirect("/login");
  }
}

export async function requireLocalContext(): Promise<LocalContext> {
  await readValidSession();

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

export async function loginAction(formData: FormData) {
  "use server";

  const authConfig = getAuthConfig();
  if (!authConfig) {
    redirect("/login?error=missing-config");
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password !== authConfig.loginPassword) {
    redirect("/login?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createSessionValue(authConfig.sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}
