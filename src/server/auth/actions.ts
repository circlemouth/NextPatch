"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthConfig, SESSION_COOKIE_NAME } from "@/server/auth/config";
import { createSessionToken } from "@/server/auth/session-token";
import { getLoginPath, sanitizeNextPath } from "@/server/auth/redirects";

export async function loginAction(formData: FormData) {
  const config = getAuthConfig();
  const nextPath = sanitizeNextPath(formData.get("next")?.toString());

  if (!config) {
    redirect(getLoginPath(nextPath, "disabled"));
  }

  const password = formData.get("password")?.toString() ?? "";
  if (!isPasswordMatch(password, config.loginPassword)) {
    redirect(getLoginPath(nextPath, "invalid"));
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await createSessionToken(
    {
      issuedAt: now,
      expiresAt: now + config.sessionMaxAgeSeconds
    },
    config.sessionSecret
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    path: "/",
    maxAge: config.sessionMaxAgeSeconds
  });

  redirect(nextPath || "/dashboard");
}

export async function logoutAction() {
  const config = getAuthConfig();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: config?.cookieSecure ?? false,
    path: "/",
    maxAge: 0
  });

  redirect("/login");
}

function isPasswordMatch(actual: string, expected: string) {
  const actualHash = crypto.createHash("sha256").update(actual, "utf8").digest();
  const expectedHash = crypto.createHash("sha256").update(expected, "utf8").digest();
  return actualHash.length === expectedHash.length && crypto.timingSafeEqual(actualHash, expectedHash);
}
