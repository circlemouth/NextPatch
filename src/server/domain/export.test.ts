import Database from "better-sqlite3";
import crypto from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { closeSqliteDbForTests } from "@/server/db/client";
import { exportEntityTables, LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "@/server/db/schema";
import type { BackupDocument } from "./export";
import { createBackupDocument, toCsvExport, toMarkdownExport, validateBackupJson } from "./export";

const backup: BackupDocument = {
  format: "nextpatch.backup",
  schemaVersion: 1,
  exportedAt: "2026-04-21T00:00:00.000Z",
  app: { name: "NextPatch" as const, version: "0.1.0" },
  scope: { type: "workspace" as const, workspaceId: "workspace-1" },
  options: {
    includeArchived: true as const,
    includeDeleted: true as const,
    includeAuditLogs: false as const,
    includeAttachments: false as const,
    redaction: "none" as const
  },
  entities: {
    repositories: [{ name: "Docs", github_full_name: "openai/docs" }],
    workItems: [{ id: "wi-1", type: "bug", title: "Crash", status: "open", priority: "p1" }]
  },
  integrity: {
    counts: { repositories: 1, workItems: 1 },
    contentHash: "sha256:test"
  }
};

function createExportTestDb() {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "nextpatch-export-"));
  const dbPath = path.join(tempDir, "nextpatch.sqlite");
  process.env.NEXTPATCH_DB_PATH = dbPath;

  const db = new Database(dbPath);
  db.exec(`
    create table workspaces (
      id text primary key,
      name text not null
    );

    create table export_logs (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      format text not null,
      content_hash text,
      created_at text not null
    );
  `);

  for (const table of exportEntityTables) {
    if (table.tableName === "workspaces") {
      continue;
    }

    db.exec(`
      create table ${table.tableName} (
        id text primary key,
        workspace_id text not null,
        user_id text,
        name text,
        title text,
        type text,
        status text,
        priority text,
        github_full_name text,
        created_at text
      );
    `);
  }

  db.prepare("insert into workspaces (id, name) values (?, ?)").run(PERSONAL_WORKSPACE_ID, "Personal workspace");
  db.prepare(
    `insert into repositories (id, workspace_id, user_id, name, github_full_name)
     values (?, ?, ?, ?, ?)`
  ).run("repo-1", PERSONAL_WORKSPACE_ID, LOCAL_USER_ID, "Docs", "openai/docs");
  db.prepare(
    `insert into repositories (id, workspace_id, user_id, name, github_full_name)
     values (?, ?, ?, ?, ?)`
  ).run("repo-other", "other-workspace", LOCAL_USER_ID, "Other", "openai/other");
  db.prepare(
    `insert into work_items (id, workspace_id, user_id, title, type, status, priority)
     values (?, ?, ?, ?, ?, ?, ?)`
  ).run("wi-1", PERSONAL_WORKSPACE_ID, LOCAL_USER_ID, "Crash", "bug", "open", "p1");
  db.close();

  return { dbPath, tempDir };
}

afterEach(() => {
  closeSqliteDbForTests();
  delete process.env.NEXTPATCH_DB_PATH;
});

describe("validateBackupJson", () => {
  it("accepts nextpatch.backup v1", () => {
    const result = validateBackupJson(
      JSON.stringify({ format: "nextpatch.backup", schemaVersion: 1, entities: {} })
    );
    expect(result.ok).toBe(true);
  });

  it("rejects invalid JSON", () => {
    expect(validateBackupJson("{").ok).toBe(false);
  });

  it("rejects unsupported schema versions", () => {
    const result = validateBackupJson(
      JSON.stringify({ format: "nextpatch.backup", schemaVersion: 2, entities: {} })
    );
    expect(result.ok).toBe(false);
  });

  it("rejects missing entities", () => {
    const result = validateBackupJson(JSON.stringify({ format: "nextpatch.backup", schemaVersion: 1 }));
    expect(result.ok).toBe(false);
  });
});

describe("export formatting", () => {
  it("renders markdown export with repository and work item summaries", () => {
    const markdown = toMarkdownExport(backup);
    expect(markdown).toContain("# NextPatch Export");
    expect(markdown).toContain("- Docs (openai/docs)");
    expect(markdown).toContain("- [bug / open] Crash");
  });

  it("renders csv export with quoted cells", () => {
    const csv = toCsvExport({
      ...backup,
      entities: {
        ...backup.entities,
        workItems: [{ id: "wi-2", type: "task", title: 'Say "hi"', status: "doing", priority: "p2" }]
      }
    });

    expect(csv).toContain('"wi-2","task","Say ""hi""","doing","p2"');
  });
});

describe("createBackupDocument", () => {
  it("reads personal-workspace scoped entities from SQLite and logs the export", async () => {
    const { dbPath, tempDir } = createExportTestDb();

    try {
      const result = await createBackupDocument("json");
      const expectedHash = `sha256:${crypto
        .createHash("sha256")
        .update(JSON.stringify({ entities: result.entities, counts: result.integrity.counts }))
        .digest("hex")}`;

      expect(result.scope.workspaceId).toBe(PERSONAL_WORKSPACE_ID);
      expect(result.entities.workspaces).toEqual([{ id: PERSONAL_WORKSPACE_ID, name: "Personal workspace" }]);
      expect(result.entities.repositories).toHaveLength(1);
      expect(result.entities.repositories).toEqual([
        expect.objectContaining({ id: "repo-1", workspace_id: PERSONAL_WORKSPACE_ID, name: "Docs" })
      ]);
      expect(result.integrity.contentHash).toBe(expectedHash);

      const db = new Database(dbPath, { readonly: true });
      const log = db.prepare("select workspace_id, user_id, format, content_hash from export_logs").get();
      db.close();

      expect(log).toEqual({
        workspace_id: PERSONAL_WORKSPACE_ID,
        user_id: LOCAL_USER_ID,
        format: "json",
        content_hash: result.integrity.contentHash
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
