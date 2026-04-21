import { getDb } from "@/server/db/client";
import { ensureLocalContext } from "@/server/db/queries/context";

const context = ensureLocalContext(getDb());

console.log(`Seeded ${context.user.id} in ${context.workspace.id}.`);
