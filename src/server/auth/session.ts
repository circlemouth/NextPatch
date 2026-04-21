import { getQueryContext } from "@/server/db/queries/context";

export async function requireSession() {
  return getQueryContext();
}
