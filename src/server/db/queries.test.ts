// @vitest-environment node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "@/server/auth/session";
import { closeDatabaseConnection, getSqlite } from "@/server/db/client";
import { classifyMemoCommand, quickCaptureCommand } from "@/server/db/queries/classification";
import { archiveRepositoryCommand, createRepositoryCommand, getRepositoryById, listRepositories } from "@/server/db/queries/repositories";
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

function insertRepositoryDirectly(input: {
  workspaceId: string;
  userId: string;
  name: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
}) {
  const id = crypto.randomUUID();
  const now = "2026-04-21T00:00:00.000Z";

  getSqlite()
    .prepare(
      `insert or ignore into workspaces (id, owner_user_id, name, created_at, updated_at)
       values (?, ?, ?, ?, ?)`
    )
    .run(input.workspaceId, input.userId, input.workspaceId, now, now);

  getSqlite()
    .prepare(
      `insert into repositories (
        id, workspace_id, user_id, provider, name, production_status, criticality,
        created_at, updated_at, archived_at, deleted_at
      ) values (?, ?, ?, 'manual', ?, 'development', 'medium', ?, ?, ?, ?)`
    )
    .run(id, input.workspaceId, input.userId, input.name, now, now, input.archivedAt ?? null, input.deletedAt ?? null);

  return id;
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

  it("gets only active repositories by id", async () => {
    const ctx = setup();
    const activeId = await createRepositoryCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "manual",
      name: "Active repo",
      productionStatus: "development",
      criticality: "medium"
    });
    const archivedId = insertRepositoryDirectly({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      name: "Archived repo",
      archivedAt: "2026-04-21T00:00:00.000Z"
    });
    const deletedId = insertRepositoryDirectly({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      name: "Deleted repo",
      deletedAt: "2026-04-21T00:00:00.000Z"
    });

    expect(await getRepositoryById(ctx.workspaceId, activeId)).toEqual(expect.objectContaining({ id: activeId }));
    expect(await getRepositoryById(ctx.workspaceId, archivedId)).toBeNull();
    expect(await getRepositoryById(ctx.workspaceId, deletedId)).toBeNull();
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

  it("validates initial status before creating work items", async () => {
    const ctx = setup();

    const itemId = await createWorkItemCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "task",
      title: "Valid initial status",
      status: "todo",
      priority: "p2",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    await expect(
      createWorkItemCommand({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        repositoryId: null,
        scope: "global",
        type: "task",
        title: "Invalid initial status",
        status: "resolved",
        priority: "p2",
        sourceType: "manual",
        privacyLevel: "normal",
        isPinned: false
      })
    ).rejects.toThrow("Unsupported status for task: resolved");

    expect(getSqlite().prepare("select id from work_items where title = ?").get("Valid initial status")).toEqual({ id: itemId });
    expect(getSqlite().prepare("select count(*) as count from work_items where title = ?").get("Invalid initial status")).toEqual({
      count: 0
    });
  });

  it("validates repository references before creating work items", async () => {
    const ctx = setup();
    const activeRepositoryId = await createRepositoryCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: "manual",
      name: "Active command repo",
      productionStatus: "development",
      criticality: "medium"
    });
    const otherWorkspaceRepositoryId = insertRepositoryDirectly({
      workspaceId: "other-workspace",
      userId: ctx.userId,
      name: "Other workspace repo"
    });
    const archivedRepositoryId = insertRepositoryDirectly({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      name: "Archived command repo",
      archivedAt: "2026-04-21T00:00:00.000Z"
    });
    const deletedRepositoryId = insertRepositoryDirectly({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      name: "Deleted command repo",
      deletedAt: "2026-04-21T00:00:00.000Z"
    });

    await expect(
      createWorkItemCommand({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        repositoryId: activeRepositoryId,
        scope: "repository",
        type: "task",
        title: "Valid repository item",
        status: "todo",
        priority: "p2",
        sourceType: "manual",
        privacyLevel: "normal",
        isPinned: false
      })
    ).resolves.toEqual(expect.any(String));

    await expect(
      createWorkItemCommand({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        repositoryId: null,
        scope: "global",
        type: "task",
        title: "Null repository item",
        status: "todo",
        priority: "p2",
        sourceType: "manual",
        privacyLevel: "normal",
        isPinned: false
      })
    ).resolves.toEqual(expect.any(String));

    for (const repositoryId of [otherWorkspaceRepositoryId, archivedRepositoryId, deletedRepositoryId]) {
      await expect(
        createWorkItemCommand({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          repositoryId,
          scope: "repository",
          type: "task",
          title: `Rejected repository item ${repositoryId}`,
          status: "todo",
          priority: "p2",
          sourceType: "manual",
          privacyLevel: "normal",
          isPinned: false
        })
      ).rejects.toThrow(`Active repository not found in workspace: ${repositoryId}`);
    }

    expect(getSqlite().prepare("select count(*) as count from work_items where title like 'Rejected repository item%'").get()).toEqual({
      count: 0
    });
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

  it("rejects quick capture repository references outside the workspace", async () => {
    const ctx = setup();
    const otherWorkspaceRepositoryId = insertRepositoryDirectly({
      workspaceId: "other-workspace",
      userId: ctx.userId,
      name: "Other quick capture repo"
    });

    await expect(
      quickCaptureCommand({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        repositoryId: otherWorkspaceRepositoryId,
        scope: "repository",
        type: "task",
        title: "Cross workspace quick capture",
        body: "body",
        privacyLevel: "normal",
        isPinned: false,
        sourceType: "manual",
        importResult: { format: "markdown", candidates: [] }
      })
    ).rejects.toThrow(`Active repository not found in workspace: ${otherWorkspaceRepositoryId}`);

    expect(getSqlite().prepare("select count(*) as count from work_items where title = ?").get("Cross workspace quick capture")).toEqual({
      count: 0
    });
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

  it("rejects memo classification repository references outside the workspace", async () => {
    const ctx = setup();
    const memoId = await quickCaptureCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "inbox",
      type: "memo",
      title: "Classify with invalid repository",
      body: "memo body",
      privacyLevel: "normal",
      isPinned: false,
      sourceType: "manual",
      importResult: { format: "markdown", candidates: [] }
    });
    const otherWorkspaceRepositoryId = insertRepositoryDirectly({
      workspaceId: "other-workspace",
      userId: ctx.userId,
      name: "Other classify repo"
    });

    await expect(
      classifyMemoCommand({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        memoId,
        repositoryId: otherWorkspaceRepositoryId,
        targetType: "task",
        title: "Classified into other workspace repo",
        priority: "p2"
      })
    ).rejects.toThrow(`Active repository not found in workspace: ${otherWorkspaceRepositoryId}`);

    expect(getSqlite().prepare("select status from work_items where id = ?").get(memoId)).toEqual({ status: "unreviewed" });
    expect(getSqlite().prepare("select count(*) as count from work_items where title = ?").get("Classified into other workspace repo")).toEqual({
      count: 0
    });
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
