import { drizzle } from "drizzle-orm/better-sqlite3";
import { openSqliteDatabase } from "./client";
import { getDatabasePath } from "./paths";
import { LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "../auth/session";
import { localUsers, workspaceMembers, workspaces } from "./schema";
import * as schema from "./schema";

export function seedDatabase(dbPath = getDatabasePath()) {
  const sqlite = openSqliteDatabase(dbPath);
  const db = drizzle(sqlite, { schema });
  const now = new Date().toISOString();

  try {
    db.transaction((tx) => {
      tx.insert(localUsers)
        .values({
          id: LOCAL_USER_ID,
          displayName: "Local user",
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoNothing()
        .run();

      tx.insert(workspaces)
        .values({
          id: PERSONAL_WORKSPACE_ID,
          ownerUserId: LOCAL_USER_ID,
          name: "Personal workspace",
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoNothing()
        .run();

      tx.insert(workspaceMembers)
        .values({
          id: "personal-workspace-owner",
          workspaceId: PERSONAL_WORKSPACE_ID,
          userId: LOCAL_USER_ID,
          role: "owner",
          createdAt: now
        })
        .onConflictDoNothing()
        .run();
    });
  } finally {
    sqlite.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
  console.log(`Seeded ${LOCAL_USER_ID} and ${PERSONAL_WORKSPACE_ID}`);
}
