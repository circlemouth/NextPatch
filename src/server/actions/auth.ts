"use server";

import { redirect } from "next/navigation";

export async function signInWithEmail(formData: FormData) {
  void formData;
  redirect("/dashboard");
}

export async function logout() {
  redirect("/dashboard");
}
