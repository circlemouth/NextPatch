// @vitest-environment node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "@/server/auth/session";
import { closeDatabaseConnection, getSqlite } from "@/server/db/client";
import { classifyMemoCommand, quickCaptureCommand } from "@/server/db/queries/classification";
import { archiveRepositoryCommand, createRepositoryCommand, listRepositories } from "@/server/db/queries/repositories";
import { createWorkItemCommand, listAllMemoWorkItems, listMemoWorkItems, listWorkItems, updateWorkItemStatusCommand } from "@/server/db/queries/work-items";
import { migrateDatabase } from "@/server/db/migrate";
import { seedDatabase } from "@/server/db/seed";
import { getDashboard } from "@/server/domain/dashboard";
import { createBackupDocument, toCsvExport, toMarkdownExport } from "@/server/domain/export";

let cleanup: (() => void) | undefined;
let previousDbPath: string | undefined;

afterEach(() => {
  closeDatabaseConnection();
  cleanup?.();
  cleanup = undefined;

  if (previousDbPath === undefined) {
    delete process.env.NEXTPATCH_DB_PATH;
  } else {
    process.env.NEXTPATCH_DB_PATH = previousDbPath;
  }
});

function setup() {
  previousDbPath = process.env.NEXTPATCH_DB_PATH;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-query-"));
  const dbPath = path.join(tempDir, "nextpatch.test.sqlite");
  process.env.NEXTPATCH_DB_PATH = dbPath;
  cleanup = () => fs.rmSync(tempDir, { recursive: true, force: true });

  migrateDatabase(dbPath);
  seedDatabase(dbPath);

  return {
    workspaceId: PERSONAL_WORKSPACE_ID,
    userId: LOCAL_USER_ID
  };
}

describe("SQLite repository queries", () => {
  it("creates, lists, and archives repositories within the personal workspace", async () => {
    const ctx = setup();

    const id = await createRepositoryCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "github",
      name: "NextPatch",
      htmlUrl: "https://github.com/example/nextpatch",
      githubHost: "github.com",
      githubOwner: "example",
      githubRepo: "nextpatch",
      githubFullName: "example/nextpatch",
      productionStatus: "active_production",
      criticality: "high"
    });

    expect(await listRepositories(ctx.workspaceId)).toEqual([
      expect.objectContaining({ id, name: "NextPatch", workspace_id: ctx.workspaceId })
    ]);

    await archiveRepositoryCommand(ctx.workspaceId, id);

    expect(await listRepositories(ctx.workspaceId)).toEqual([]);
  });
});

describe("SQLite work item and classification queries", () => {
  it("creates work items and records status history in one status transaction", async () => {
    const ctx = setup();
    const repositoryId = await createRepositoryCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "manual",
      name: "Runtime",
      productionStatus: "active_production",
      criticality: "high"
    });

    const itemId = await createWorkItemCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId,
      scope: "repository",
      type: "bug",
      title: "Crash on startup",
      status: "unconfirmed",
      priority: "p1",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    await updateWorkItemStatusCommand(ctx.workspaceId, ctx.userId, itemId, "resolved");

    const histories = getSqlite().prepare("select from_status, to_status from status_histories").all();
    expect((await listWorkItems(ctx.workspaceId))[0]).toMatchObject({ id: itemId, status: "resolved" });
    expect(histories).toEqual([{ from_status: "unconfirmed", to_status: "resolved" }]);
  });

  it("applies default statuses when quick capturing different types", async () => {
    const ctx = setup();

    await quickCaptureCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "task",
      title: "Task",
      body: "task body",
      privacyLevel: "normal",
      isPinned: false,
      sourceType: "manual",
      importResult: { format: "markdown", candidates: [] }
    });
    await quickCaptureCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "bug",
      title: "Bug",
      body: "bug body",
      privacyLevel: "normal",
      isPinned: false,
      sourceType: "manual",
      importResult: { format: "markdown", candidates: [] }
    });
    await quickCaptureCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "idea",
      title: "Idea",
      body: "idea body",
      privacyLevel: "normal",
      isPinned: false,
      sourceType: "manual",
      importResult: { format: "markdown", candidates: [] }
    });
    await quickCaptureCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "inbox",
      type: "memo",
      title: "Memo",
      body: "memo body",
      privacyLevel: "normal",
      isPinned: false,
      sourceType: "manual",
      importResult: { format: "markdown", candidates: [] }
    });

    const statuses = getSqlite()
      .prepare("select type, status from work_items order by created_at")
      .all() as Array<{ type: string; status: string }>;

    expect(statuses).toEqual([
      { type: "task", status: "todo" },
      { type: "bug", status: "unconfirmed" },
      { type: "idea", status: "unreviewed" },
      { type: "memo", status: "unreviewed" }
    ]);
  });

  it("lists only unreviewed memos in the inbox query", async () => {
    const ctx = setup();

    const memoId = await quickCaptureCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "inbox",
      type: "memo",
      title: "Installer note",
      body: "Investigate installer issue",
      privacyLevel: "normal",
      isPinned: false,
      sourceType: "chatgpt",
      importResult: {
        format: "markdown",
        candidates: [{ targetType: "bug", title: "Installer fails", body: "", confidence: "medium" }]
      }
    });

    await classifyMemoCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      memoId,
      repositoryId: null,
      targetType: "task",
      title: "Review installer",
      priority: "p2"
    });

    expect(await listMemoWorkItems(ctx.workspaceId)).toEqual([]);
    expect(await listAllMemoWorkItems(ctx.workspaceId)).toEqual([
      expect.objectContaining({ id: memoId, status: "itemized", type: "memo" })
    ]);
  });

  it("rejects invalid memo classification attempts", async () => {
    const ctx = setup();

    await expect(
      classifyMemoCommand({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        memoId: crypto.randomUUID(),
        repositoryId: null,
        targetType: "task",
        title: "Missing memo",
        priority: "p2"
      })
    ).rejects.toThrow("Unreviewed memo not found");

    const taskId = await createWorkItemCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "task",
      title: "Not a memo",
      status: "todo",
      priority: "p2",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    await expect(
      classifyMemoCommand({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        memoId: taskId,
        repositoryId: null,
        targetType: "task",
        title: "Wrong type",
        priority: "p2"
      })
    ).rejects.toThrow("Work item is not a memo");

    const memoId = await quickCaptureCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "inbox",
      type: "memo",
      title: "Later classified",
      body: "memo body",
      privacyLevel: "normal",
      isPinned: false,
      sourceType: "manual",
      importResult: { format: "markdown", candidates: [] }
    });

    await classifyMemoCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      memoId,
      repositoryId: null,
      targetType: "task",
      title: "Classified once",
      priority: "p2"
    });

    await expect(
      classifyMemoCommand({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        memoId,
        repositoryId: null,
        targetType: "task",
        title: "Classified twice",
        priority: "p2"
      })
    ).rejects.toThrow("Memo is already classified");
  });

  it("rejects invalid status updates without writing history", async () => {
    const ctx = setup();
    const bugId = await createWorkItemCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "bug",
      title: "Crash",
      status: "unconfirmed",
      priority: "p1",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    await expect(updateWorkItemStatusCommand(ctx.workspaceId, ctx.userId, bugId, "done")).rejects.toThrow(
      "Unsupported status for bug: done"
    );

    const storedItem = getSqlite().prepare("select status from work_items where id = ?").get(bugId) as { status: string };
    const histories = getSqlite().prepare("select count(*) as count from status_histories").get() as { count: number };

    expect(storedItem.status).toBe("unconfirmed");
    expect(histories.count).toBe(0);
  });

  it("updates valid status changes and rejects missing items", async () => {
    const ctx = setup();
    const itemId = await createWorkItemCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "task",
      title: "Cleanup",
      status: "todo",
      priority: "p2",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    await updateWorkItemStatusCommand(ctx.workspaceId, ctx.userId, itemId, "done");

    expect((await listWorkItems(ctx.workspaceId))[0]).toMatchObject({ id: itemId, status: "done" });
    expect(getSqlite().prepare("select from_status, to_status from status_histories").all()).toEqual([
      { from_status: "todo", to_status: "done" }
    ]);

    await expect(updateWorkItemStatusCommand(ctx.workspaceId, ctx.userId, crypto.randomUUID(), "done")).rejects.toThrow(
      "Work item not found"
    );
  });
});

describe("SQLite dashboard and export queries", () => {
  it("builds dashboard buckets and export artifacts from local SQLite data", async () => {
    const ctx = setup();
    const repositoryId = await createRepositoryCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "manual",
      name: "Production repo",
      productionStatus: "active_production",
      criticality: "high"
    });

    await createWorkItemCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId,
      scope: "repository",
      type: "bug",
      title: 'Ship "backup"',
      status: "unconfirmed",
      priority: "p0",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    const dashboard = await getDashboard();
    const backup = await createBackupDocument("json");
    const csv = toCsvExport(backup);
    const markdown = toMarkdownExport(backup);
    const exportLogCount = getSqlite().prepare("select count(*) as count from export_logs").get() as { count: number };

    expect(dashboard.criticalBugs).toHaveLength(1);
    expect(backup.integrity.counts.repositories).toBe(1);
    expect(backup.integrity.counts.workItems).toBe(1);
    expect(backup.integrity.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(csv).toContain('"Ship ""backup"""');
    expect(markdown).toContain("- Production repo");
    expect(exportLogCount.count).toBe(1);
  });
});
