import { describe, expect, it } from "vitest";
import { parseImportContent } from "./import-parser";

describe("parseImportContent", () => {
  it("builds candidates from nextpatch.import.v1 JSON", () => {
    const result = parseImportContent(
      JSON.stringify({
        schema_version: "nextpatch.import.v1",
        source: { tool: "ChatGPT" },
        summary: "",
        items: [
          { kind: "bug", title: "Crash", body: "Steps", needs_review: true, confidence: "high" },
          { kind: "future_plan", title: "Roadmap", body: "Later" }
        ]
      })
    );

    expect(result.format).toBe("json");
    expect(result.candidates[0]).toMatchObject({ targetType: "bug", title: "Crash" });
    expect(result.candidates[1]).toMatchObject({ targetType: "future_feature", confidence: "medium" });
  });

  it("keeps invalid JSON as saved raw memo with parse error", () => {
    const result = parseImportContent("```json\n{\"schema_version\":\n```");
    expect(result.format).toBe("invalid_json");
    expect(result.candidates).toHaveLength(0);
    expect(result.error).toBeTruthy();
  });

  it("builds markdown candidates from bullet lists", () => {
    const result = parseImportContent("- [memo] Meeting notes\n* [task] Fix login");
    expect(result.format).toBe("markdown");
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0]).toMatchObject({ targetType: "memo", title: "Meeting notes" });
  });

  it("falls back to plain text when no structured input is found", () => {
    const result = parseImportContent("just some pasted text");
    expect(result.format).toBe("plain_text");
    expect(result.candidates).toHaveLength(0);
  });
});
