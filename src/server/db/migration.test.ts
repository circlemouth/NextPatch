// @vitest-environment node

import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "@/server/auth/session";
import { migrateDatabase } from "@/server/db/migrate";
import { seedDatabase } from "@/server/db/seed";

let cleanup: (() => void) | undefined;

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
});

function createTempDbPath() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-sqlite-"));
  cleanup = () => fs.rmSync(tempDir, { recursive: true, force: true });
  return path.join(tempDir, "nextpatch.test.sqlite");
}

describe("SQLite migration and seed", () => {
  it("creates the local user, personal workspace, and owner membership", () => {
    const dbPath = createTempDbPath();

    migrateDatabase(dbPath);
    seedDatabase(dbPath);

    const sqlite = new Database(dbPath);
    try {
      const user = sqlite.prepare("select id from local_users where id = ?").get(LOCAL_USER_ID) as { id: string };
      const workspace = sqlite.prepare("select id from workspaces where id = ?").get(PERSONAL_WORKSPACE_ID) as {
        id: string;
      };
      const membership = sqlite
        .prepare("select role from workspace_members where workspace_id = ? and user_id = ?")
        .get(PERSONAL_WORKSPACE_ID, LOCAL_USER_ID) as { role: string };
      const foreignKeys = sqlite.prepare("pragma foreign_keys").get() as { foreign_keys: number };
      const journal = sqlite.prepare("pragma journal_mode").get() as { journal_mode: string };

      expect(user.id).toBe(LOCAL_USER_ID);
      expect(workspace.id).toBe(PERSONAL_WORKSPACE_ID);
      expect(membership.role).toBe("owner");
      expect(foreignKeys.foreign_keys).toBe(1);
      expect(journal.journal_mode).toBe("wal");
    } finally {
      sqlite.close();
    }
  });

  it("runs migration and seed idempotently", () => {
    const dbPath = createTempDbPath();

    migrateDatabase(dbPath);
    seedDatabase(dbPath);
    migrateDatabase(dbPath);
    seedDatabase(dbPath);

    const sqlite = new Database(dbPath);
    try {
      const count = sqlite.prepare("select count(*) as count from workspace_members").get() as { count: number };
      expect(count.count).toBe(1);
    } finally {
      sqlite.close();
    }
  });
});
