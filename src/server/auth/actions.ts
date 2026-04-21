"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getAuthConfig,
  safeNextPath
} from "./core";

export async function loginWithPassword(formData: FormData) {
  const next = safeNextPath(formData.get("next")?.toString(), "/dashboard");
  const password = formData.get("password")?.toString() ?? "";

  let config: ReturnType<typeof getAuthConfig> | undefined;
  try {
    config = getAuthConfig();
  } catch {
    redirect(`/login?error=auth_config&next=${encodeURIComponent(next)}`);
  }

  if (!config) {
    redirect(`/login?error=auth_config&next=${encodeURIComponent(next)}`);
  }

  if (password !== config.loginPassword) {
    redirect(`/login?error=invalid_credentials&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createSessionToken({ config }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: config.sessionMaxAgeSeconds
  });

  redirect(next);
}
