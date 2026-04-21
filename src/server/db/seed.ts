import { openNextPatchDatabase, type NextPatchDatabase } from "@/server/db/client";
import { LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "@/server/db/queries/context";

export function seedDatabase(target?: NextPatchDatabase | string) {
  const ownsConnection = typeof target === "string" || !target;
  const db = typeof target === "string" || !target ? openNextPatchDatabase(target) : target;
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT OR IGNORE INTO local_users (id, email, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `
  ).run(LOCAL_USER_ID, "local-user@nextpatch.local", "Local user", now, now);

  db.prepare(
    `
      INSERT OR IGNORE INTO workspaces (id, name, owner_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `
  ).run(PERSONAL_WORKSPACE_ID, "Personal workspace", LOCAL_USER_ID, now, now);

  db.prepare(
    `
      INSERT OR IGNORE INTO workspace_members (id, workspace_id, user_id, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
  ).run("personal-workspace-owner", PERSONAL_WORKSPACE_ID, LOCAL_USER_ID, "owner", now);

  if (ownsConnection) {
    db.close();
  }
}

