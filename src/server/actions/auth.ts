"use server";

import { redirect } from "next/navigation";

export async function enterLocalApp() {
  redirect("/dashboard");
}

export async function logout() {
  redirect("/login");
}
