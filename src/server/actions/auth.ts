"use server";

import { createServerSupabaseClient } from "@/server/supabase/server";
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

  const supabase = await createServerSupabaseClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`
    }
  });

  if (error) {
    redirect("/login?message=magic link の送信に失敗しました。Supabase Auth 設定を確認してください。");
  }

  redirect("/login?message=magic link を送信しました。メールまたは Supabase local のメールビューアを確認してください。");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
