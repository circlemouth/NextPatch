import { describe, expect, it } from "vitest";
import { applyStatusTimestamps, isClosed, isCompleted } from "./status";

describe("status lifecycle", () => {
  it("separates completed and closed", () => {
    expect(isCompleted("bug", "not_planned")).toBe(false);
    expect(isClosed("bug", "not_planned")).toBe(true);
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
});
