import { describe, expect, it } from "vitest";
import { parseImportContent } from "./import-parser";

describe("parseImportContent", () => {
  it("builds candidates from nextpatch.import.v1 JSON", () => {
    const result = parseImportContent(
      JSON.stringify({
        schema_version: "nextpatch.import.v1",
        source: { tool: "ChatGPT" },
        summary: "",
        items: [{ kind: "bug", title: "Crash", body: "Steps", needs_review: true, confidence: "high" }]
      })
    );

    expect(result.format).toBe("json");
    expect(result.candidates[0]).toMatchObject({ targetType: "bug", title: "Crash" });
  });

  it("keeps invalid JSON as saved raw memo with parse error", () => {
    const result = parseImportContent("```json\n{\"schema_version\":\n```");
    expect(result.format).toBe("invalid_json");
    expect(result.candidates).toHaveLength(0);
    expect(result.error).toBeTruthy();
  });
});
