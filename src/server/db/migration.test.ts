// @vitest-environment node

import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
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

function createTempSandbox() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-sqlite-"));
  cleanup = () => fs.rmSync(tempDir, { recursive: true, force: true });
  return {
    dbPath: path.join(tempDir, "nextpatch.test.sqlite"),
    migrationDir: path.join(tempDir, "drizzle")
  };
}

function copyInitialMigration(migrationDir: string) {
  fs.mkdirSync(migrationDir, { recursive: true });
  fs.copyFileSync(
    path.resolve("drizzle/0000_initial_sqlite.sql"),
    path.join(migrationDir, "0000_initial_sqlite.sql")
  );
}

describe("SQLite migration and seed", () => {
  it("creates the local user, personal workspace, and owner membership", () => {
    const { dbPath, migrationDir } = createTempSandbox();
    copyInitialMigration(migrationDir);

    migrateDatabase(dbPath, migrationDir);
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
    const { dbPath, migrationDir } = createTempSandbox();
    copyInitialMigration(migrationDir);

    migrateDatabase(dbPath, migrationDir);
    seedDatabase(dbPath);
    migrateDatabase(dbPath, migrationDir);
    seedDatabase(dbPath);

    const sqlite = new Database(dbPath);
    try {
      const count = sqlite.prepare("select count(*) as count from workspace_members").get() as { count: number };
      expect(count.count).toBe(1);
      const migrations = sqlite
        .prepare("select id, checksum, applied_at from nextpatch_migrations order by id")
        .all() as Array<{ id: string; checksum: string; applied_at: string }>;

      expect(migrations).toHaveLength(1);
      expect(migrations[0].id).toBe("0000_initial_sqlite.sql");
      expect(migrations[0].checksum).toHaveLength(64);
      expect(migrations[0].applied_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    } finally {
      sqlite.close();
    }
  });

  it("fails when an applied migration checksum changes", () => {
    const { dbPath, migrationDir } = createTempSandbox();
    copyInitialMigration(migrationDir);

    migrateDatabase(dbPath, migrationDir);

    fs.appendFileSync(path.join(migrationDir, "0000_initial_sqlite.sql"), "\n-- checksum drift");

    expect(() => migrateDatabase(dbPath, migrationDir)).toThrow(/Migration checksum changed/);
  });

  it("fails when an applied migration file is missing", () => {
    const { dbPath, migrationDir } = createTempSandbox();
    copyInitialMigration(migrationDir);

    migrateDatabase(dbPath, migrationDir);
    fs.rmSync(path.join(migrationDir, "0000_initial_sqlite.sql"));

    expect(() => migrateDatabase(dbPath, migrationDir)).toThrow(
      "Applied migration file is missing: 0000_initial_sqlite.sql"
    );
  });

  it("respects NEXTPATCH_DATA_DIR in database init and reset scripts", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-script-paths-"));
    cleanup = () => fs.rmSync(tempDir, { recursive: true, force: true });
    const dataDir = path.join(tempDir, "review-data-dir");
    const dbPath = path.join(dataDir, "nextpatch.sqlite");
    const scriptEnv: NodeJS.ProcessEnv = {
      ...process.env,
      NEXTPATCH_DATA_DIR: dataDir
    };
    delete scriptEnv.NEXTPATCH_DB_PATH;

    execFileSync(process.execPath, [path.resolve("scripts/db-init.mjs")], {
      cwd: process.cwd(),
      env: scriptEnv,
      stdio: "pipe"
    });

    expect(fs.existsSync(dbPath)).toBe(true);

    fs.writeFileSync(`${dbPath}-wal`, "");
    fs.writeFileSync(`${dbPath}-shm`, "");
    const unrelatedPath = path.join(dataDir, "keep.txt");
    fs.writeFileSync(unrelatedPath, "keep");

    execFileSync(process.execPath, [path.resolve("scripts/reset-dev-db.mjs")], {
      cwd: process.cwd(),
      env: scriptEnv,
      stdio: "pipe"
    });

    expect(fs.existsSync(dbPath)).toBe(false);
    expect(fs.existsSync(`${dbPath}-wal`)).toBe(false);
    expect(fs.existsSync(`${dbPath}-shm`)).toBe(false);
    expect(fs.readFileSync(unrelatedPath, "utf8")).toBe("keep");
  });
});
