// @vitest-environment node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/queries/context", () => ({
  assertPersonalWorkspaceScope: vi.fn()
}));

import { LOCAL_USER_ID, PERSONAL_WORKSPACE_ID } from "@/server/auth/session";
import { closeDatabaseConnection, getSqlite } from "@/server/db/client";
import { classifyMemoCommand } from "@/server/db/queries/classification";
import { listDashboardWorkItems } from "@/server/db/queries/dashboard";
import { createWorkItemCommand, updateWorkItemStatusCommand } from "@/server/db/queries/work-items";
import { migrateDatabase } from "@/server/db/migrate";
import { seedDatabase } from "@/server/db/seed";

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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-query-guardrails-"));
  const dbPath = path.join(tempDir, "nextpatch.test.sqlite");
  process.env.NEXTPATCH_DB_PATH = dbPath;
  cleanup = () => fs.rmSync(tempDir, { recursive: true, force: true });

  migrateDatabase(dbPath);
  seedDatabase(dbPath);

  return {
    workspaceId: PERSONAL_WORKSPACE_ID,
    otherWorkspaceId: "other-workspace",
    userId: LOCAL_USER_ID
  };
}

describe("SQLite workspace guardrails", () => {
  it("uses the provided workspace id when listing dashboard work items", async () => {
    const ctx = setup();
    const now = "2026-04-21T00:00:00.000Z";

    getSqlite()
      .prepare(
        `insert into workspaces (id, owner_user_id, name, created_at, updated_at)
         values (?, ?, ?, ?, ?)`
      )
      .run(ctx.otherWorkspaceId, ctx.userId, "Other workspace", now, now);

    await createWorkItemCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "task",
      title: "Personal dashboard item",
      status: "todo",
      priority: "p2",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    const otherWorkspaceItemId = await createWorkItemCommand({
      workspaceId: ctx.otherWorkspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "task",
      title: "Other dashboard item",
      status: "todo",
      priority: "p2",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    await expect(listDashboardWorkItems(ctx.otherWorkspaceId)).resolves.toEqual([
      expect.objectContaining({ id: otherWorkspaceItemId, title: "Other dashboard item", workspace_id: ctx.otherWorkspaceId })
    ]);
  });

  it("rejects classification from another workspace", async () => {
    const ctx = setup();
    const memoId = await createWorkItemCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "inbox",
      type: "memo",
      title: "Workspace scoped memo",
      status: "unreviewed",
      priority: "p2",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    await expect(
      classifyMemoCommand({
        workspaceId: ctx.otherWorkspaceId,
        userId: ctx.userId,
        memoId,
        repositoryId: null,
        targetType: "task",
        title: "Wrong workspace",
        priority: "p2"
      })
    ).rejects.toThrow("Unreviewed memo not found");
  });

  it("rejects status updates from another workspace", async () => {
    const ctx = setup();
    const itemId = await createWorkItemCommand({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      repositoryId: null,
      scope: "global",
      type: "task",
      title: "Workspace scoped item",
      status: "todo",
      priority: "p2",
      sourceType: "manual",
      privacyLevel: "normal",
      isPinned: false
    });

    await expect(updateWorkItemStatusCommand(ctx.otherWorkspaceId, ctx.userId, itemId, "done")).rejects.toThrow(
      "Work item not found"
    );
  });
});
