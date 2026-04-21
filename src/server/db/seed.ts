import { getDb, getSqlite } from "./client";
import { LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "../auth/session";
import { localUsers, workspaceMembers, workspaces } from "./schema";

function seed() {
  const db = getDb();
  const now = new Date().toISOString();

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
        id: crypto.randomUUID(),
        workspaceId: PERSONAL_WORKSPACE_ID,
        userId: LOCAL_USER_ID,
        role: "owner",
        createdAt: now
      })
      .onConflictDoNothing()
      .run();
  });

  getSqlite().close();
  console.log(`Seeded ${LOCAL_USER_ID} and ${PERSONAL_WORKSPACE_ID}`);
}

seed();
