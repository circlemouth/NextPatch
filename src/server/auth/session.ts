import { getLocalContext } from "@/server/db/queries/context";

export async function requireLocalContext() {
  return getLocalContext();
}
