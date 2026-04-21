import { describe, expect, it } from "vitest";
import {
  applyStatusTimestamps,
  assertAllowedWorkItemStatus,
  getWorkItemStatusActions,
  isAllowedWorkItemStatus,
  isClosed,
  isCompleted,
  isOnHold,
  isOpen
} from "./status";

describe("status lifecycle", () => {
  it("separates completed and closed", () => {
    expect(isCompleted("bug", "not_planned")).toBe(false);
    expect(isClosed("bug", "not_planned")).toBe(true);
  });

  it("treats canceled bug and future feature statuses as closed", () => {
    expect(isClosed("bug", "canceled")).toBe(true);
    expect(isClosed("future_feature", "canceled")).toBe(true);
    expect(
      isOpen({
        type: "bug",
        status: "canceled",
        archived_at: null,
        deleted_at: null
      })
    ).toBe(false);
    expect(
      isOpen({
        type: "future_feature",
        status: "canceled",
        archived_at: null,
        deleted_at: null
      })
    ).toBe(false);
  });

  it("sets completed and closed timestamps for completed status", () => {
    const result = applyStatusTimestamps(
      { type: "task", status: "todo", completed_at: null, closed_at: null },
      "done",
      "2026-04-20T00:00:00.000Z"
    );
    expect(result.completed_at).toBe("2026-04-20T00:00:00.000Z");
    expect(result.closed_at).toBe("2026-04-20T00:00:00.000Z");
  });

  it("clears completed and closed timestamps when reopening completed item", () => {
    const result = applyStatusTimestamps(
      {
        type: "task",
        status: "done",
        completed_at: "2026-04-20T00:00:00.000Z",
        closed_at: "2026-04-20T00:00:00.000Z"
      },
      "doing",
      "2026-04-21T00:00:00.000Z"
    );
    expect(result.completed_at).toBeNull();
    expect(result.closed_at).toBeNull();
  });

  it("marks hold states and non-closed items correctly", () => {
    expect(isOnHold("blocked")).toBe(true);
    expect(
      isOpen({
        type: "idea",
        status: "in_review",
        archived_at: null,
        deleted_at: null
      })
    ).toBe(true);
    expect(
      isOpen({
        type: "bug",
        status: "resolved",
        archived_at: null,
        deleted_at: null
      })
    ).toBe(false);
  });

  it("validates statuses by work item type", () => {
    expect(isAllowedWorkItemStatus("memo", "itemized")).toBe(true);
    expect(isAllowedWorkItemStatus("task", "itemized")).toBe(false);
    expect(() => assertAllowedWorkItemStatus("task", "resolved")).toThrow("Unsupported status for task: resolved");
  });

  it("returns only allowed statuses for UI status actions", () => {
    const examples = [
      { type: "task" as const, status: "todo" },
      { type: "bug" as const, status: "confirmed" },
      { type: "idea" as const, status: "in_review" },
      { type: "implementation" as const, status: "doing" },
      { type: "future_feature" as const, status: "todo" },
      { type: "memo" as const, status: "unreviewed" }
    ];

    for (const item of examples) {
      for (const action of getWorkItemStatusActions(item)) {
        expect(isAllowedWorkItemStatus(item.type, action.status)).toBe(true);
      }
    }

    expect(getWorkItemStatusActions({ type: "bug", status: "confirmed" }).map((action) => action.status)).toEqual([
      "doing",
      "fixed_waiting"
    ]);
    expect(getWorkItemStatusActions({ type: "memo", status: "unreviewed" })).toEqual([]);
  });
});
