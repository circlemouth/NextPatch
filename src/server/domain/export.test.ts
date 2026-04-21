import { describe, expect, it } from "vitest";
import type { BackupDocument } from "./export";
import { toCsvExport, toMarkdownExport, validateBackupJson } from "./export";

const backup: BackupDocument = {
  format: "nextpatch.backup",
  schemaVersion: 1,
  exportedAt: "2026-04-21T00:00:00.000Z",
  app: { name: "NextPatch", version: "0.1.0" },
  scope: { type: "workspace", workspaceId: "personal-workspace" },
  options: {
    includeArchived: true,
    includeDeleted: true,
    includeAuditLogs: false,
    includeAttachments: false,
    redaction: "none"
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
