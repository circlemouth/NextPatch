import { redirect } from "next/navigation";

export default function LoginPage() {
  // This route remains only as a bookmark-safe dashboard redirect, not a login surface.
  redirect("/dashboard");
}
