// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";

import { createMigratedTestDatabase, type TestDatabase } from "@/server/db/test-utils";
import { classifyMemo } from "@/server/db/queries/classification";
import { quickCapture } from "@/server/db/queries/capture";
import { getDashboardForDatabase } from "@/server/db/queries/dashboard";
import { createBackupDocumentFromDatabase } from "@/server/db/queries/export";
import { archiveRepository, createRepository, listRepositories } from "@/server/db/queries/repositories";
import { createWorkItem, updateWorkItemStatus } from "@/server/db/queries/work-items";
import { toCsvExport, toMarkdownExport } from "@/server/domain/export";

let testDb: TestDatabase | undefined;

afterEach(() => {
  testDb?.cleanup();
  testDb = undefined;
});

function setup() {
  testDb = createMigratedTestDatabase();
  return testDb.ctx;
}

describe("SQLite repository queries", () => {
  it("creates, lists, and archives repositories", () => {
    const ctx = setup();

    const repository = createRepository(ctx, {
      name: "NextPatch",
      htmlUrl: "https://github.com/example/nextpatch",
      productionStatus: "active_production",
      criticality: "high"
    });

    expect(repository.github_full_name).toBe("example/nextpatch");
    expect(listRepositories(ctx)).toHaveLength(1);

    archiveRepository(ctx, repository.id);

    expect(listRepositories(ctx)).toHaveLength(0);
    expect(listRepositories(ctx, { includeArchived: true })[0]).toMatchObject({
      id: repository.id,
      archived_at: expect.any(String)
    });
  });
});

describe("SQLite work item and memo queries", () => {
  it("creates work items and records status history", () => {
    const ctx = setup();
    const repository = createRepository(ctx, { name: "Runtime", productionStatus: "active_production" });

    const item = createWorkItem(ctx, {
      repositoryId: repository.id,
      type: "bug",
      title: "Crash on startup",
      priority: "p1"
    });
    const updated = updateWorkItemStatus(ctx, item.id, "resolved");
    const histories = ctx.db.prepare("SELECT from_status, to_status FROM status_histories").all();

    expect(item.status).toBe("unconfirmed");
    expect(updated.status).toBe("resolved");
    expect(updated.completed_at).toEqual(expect.any(String));
    expect(histories).toEqual([{ from_status: "unconfirmed", to_status: "resolved" }]);
  });

  it("quick captures a memo and classification turns it into a work item", () => {
    const ctx = setup();
    const repository = createRepository(ctx, { name: "Inbox target" });
    const { memo } = quickCapture(ctx, {
      body: "Investigate installer issue\n\n- [bug] Installer fails on first launch",
      sourceType: "chatgpt"
    });

    const { item, memo: classifiedMemo } = classifyMemo(ctx, {
      memoId: memo.id,
      targetType: "bug",
      repositoryId: repository.id,
      title: "Installer fails on first launch",
      priority: "p1"
    });

    expect(memo.scope).toBe("inbox");
    expect(item.repository_id).toBe(repository.id);
    expect(item.source_ref).toBe(memo.id);
    expect(classifiedMemo.status).toBe("itemized");
  });

  it("builds dashboard buckets from local query data", () => {
    const ctx = setup();
    const repository = createRepository(ctx, { name: "Production repo", productionStatus: "active_production" });
    createWorkItem(ctx, { repositoryId: repository.id, type: "bug", title: "Production data loss", priority: "p0" });
    quickCapture(ctx, { body: "Unsorted memo" });

    const dashboard = getDashboardForDatabase(ctx);

    expect(dashboard.now[0].title).toBe("Production data loss");
    expect(dashboard.criticalBugs).toHaveLength(1);
    expect(dashboard.inbox).toHaveLength(1);
  });
});

describe("SQLite export queries", () => {
  it("creates JSON, CSV, and Markdown exports with contentHash", () => {
    const ctx = setup();
    const repository = createRepository(ctx, { name: "Export repo", htmlUrl: "https://github.com/example/export" });
    createWorkItem(ctx, { repositoryId: repository.id, type: "task", title: 'Ship "backup"', priority: "p2" });

    const backup = createBackupDocumentFromDatabase(ctx, "2026-04-21T00:00:00.000Z");
    const csv = toCsvExport(backup);
    const markdown = toMarkdownExport(backup);

    expect(backup.format).toBe("nextpatch.backup");
    expect(backup.integrity.counts.repositories).toBe(1);
    expect(backup.integrity.counts.workItems).toBe(1);
    expect(backup.integrity.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(csv).toContain('"Ship ""backup"""');
    expect(markdown).toContain("- Export repo (example/export)");
    expect(markdown).toContain("- [task / todo] Ship \"backup\"");
  });
});
