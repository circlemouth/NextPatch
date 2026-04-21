// @vitest-environment node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { openNextPatchDatabase, type NextPatchDatabase } from "@/server/db/client";
import { migrateDatabase } from "@/server/db/migrate";
import { LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "@/server/db/queries/context";
import { seedDatabase } from "@/server/db/seed";

let cleanup: (() => void) | undefined;

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
});

describe("SQLite migration and seed", () => {
  it("creates an isolated temp database with local seed records and SQLite pragmas", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-migrate-"));
    const dbPath = path.join(tempDir, "nextpatch.test.sqlite");
    const db = openNextPatchDatabase(dbPath);
    cleanup = () => {
      db.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    };

    migrateDatabase(db);
    seedDatabase(db);

    const user = db.prepare("SELECT id FROM local_users WHERE id = ?").get(LOCAL_USER_ID) as { id: string };
    const workspace = db.prepare("SELECT id FROM workspaces WHERE id = ?").get(PERSONAL_WORKSPACE_ID) as {
      id: string;
    };
    const membership = db
      .prepare("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?")
      .get(PERSONAL_WORKSPACE_ID, LOCAL_USER_ID) as { role: string };
    const foreignKeys = db.prepare("PRAGMA foreign_keys").get() as { foreign_keys: number };
    const journal = db.prepare("PRAGMA journal_mode").get() as { journal_mode: string };

    expect(dbPath).toContain(tempDir);
    expect(user.id).toBe(LOCAL_USER_ID);
    expect(workspace.id).toBe(PERSONAL_WORKSPACE_ID);
    expect(membership.role).toBe("owner");
    expect(foreignKeys.foreign_keys).toBe(1);
    expect(journal.journal_mode).toBe("wal");
  });

  it("runs migration and seed idempotently", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-migrate-"));
    const dbPath = path.join(tempDir, "nextpatch.test.sqlite");
    const db = openNextPatchDatabase(dbPath);
    cleanup = () => {
      db.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    };

    migrateDatabase(db);
    seedDatabase(db);
    migrateDatabase(db);
    seedDatabase(db);

    const counts = db.prepare("SELECT COUNT(*) AS count FROM workspace_members").get() as { count: number };
    expect(counts.count).toBe(1);
  });

  it("accepts a db path directly for migration and seed", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-migrate-"));
    const dbPath = path.join(tempDir, "nextpatch.test.sqlite");
    cleanup = () => fs.rmSync(tempDir, { recursive: true, force: true });

    migrateDatabase(dbPath);
    seedDatabase(dbPath);

    const db: NextPatchDatabase = openNextPatchDatabase(dbPath);
    cleanup = () => {
      db.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    };

    expect(db.prepare("SELECT id FROM workspaces").get()).toMatchObject({ id: PERSONAL_WORKSPACE_ID });
  });
});
