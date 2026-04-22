import { describe, expect, it } from "vitest";
import { titleFromBody } from "@/server/domain/work-item-title";
import { classifyMemoSchema, quickCaptureSchema, repositorySchema, workItemSchema } from "./schemas";

describe("repositorySchema", () => {
  it("applies defaults for production status and criticality", () => {
    const result = repositorySchema.parse({ name: "NextPatch" });
    expect(result.productionStatus).toBe("development");
    expect(result.criticality).toBe("medium");
  });

  it("rejects empty names", () => {
    expect(() => repositorySchema.parse({ name: "   " })).toThrow("＊リポジトリ名を入力してください。");
  });
});

describe("workItemSchema", () => {
  it("accepts nullable repositoryId and applies defaults", () => {
    const result = workItemSchema.parse({ repositoryId: "", type: "task", title: "Fix bug", body: "Fix bug details" });
    expect(result.repositoryId).toBe("");
    expect(result.priority).toBe("p2");
    expect(result.privacyLevel).toBe("normal");
  });

  it("accepts missing titles for body-derived creation flows", () => {
    const result = workItemSchema.parse({ type: "memo", body: "First line" });
    expect(result.title).toBeUndefined();
    expect(result.body).toBe("First line");
  });

  it("rejects empty content for quick write creation flows", () => {
    expect(() => workItemSchema.parse({ type: "memo", title: "", body: "   " })).toThrow("＊内容を入力してください。");
    expect(() => workItemSchema.parse({ type: "memo", title: "" })).toThrow("＊内容を入力してください。");
  });

  it("rejects invalid privacy levels", () => {
    expect(() =>
      workItemSchema.parse({
        type: "bug",
        title: "Crash",
        body: "Crash details",
        privacyLevel: "private"
      })
    ).toThrow();
  });
});

describe("quickCaptureSchema", () => {
  it("requires body and defaults to manual capture", () => {
    const result = quickCaptureSchema.parse({ body: "Notes" });
    expect(result.type).toBe("auto");
    expect(result.sourceType).toBe("manual");
  });
});

describe("titleFromBody", () => {
  it("derives a title from the first non-empty line", () => {
    expect(titleFromBody("Investigate repo-specific issue\nFollow up later")).toBe("Investigate repo-specific issue");
    expect(titleFromBody("   \n  Follow up later")).toBe("Follow up later");
    expect(titleFromBody("   ")).toBe("Untitled memo");
  });
});

describe("classifyMemoSchema", () => {
  it("validates memo classification payloads", () => {
    const result = classifyMemoSchema.parse({
      memoId: "550e8400-e29b-41d4-a716-446655440000",
      targetType: "bug",
      title: "Crash",
      priority: "p1"
    });

    expect(result.targetType).toBe("bug");
    expect(result.repositoryId).toBeUndefined();
  });

  it("rejects memo as a classification target", () => {
    expect(() =>
      classifyMemoSchema.parse({
        memoId: "550e8400-e29b-41d4-a716-446655440000",
        targetType: "memo",
        title: "Memo target",
        priority: "p1"
      })
    ).toThrow();
  });
});
