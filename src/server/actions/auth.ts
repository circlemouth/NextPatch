"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("＊メールアドレスの形式を確認してください。")
});

export async function signInWithEmail(formData: FormData) {
  const parsed = emailSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect("/login?message=メールアドレスを確認してください。");
  }

  redirect("/dashboard");
}

export async function logout() {
  redirect("/login");
}
