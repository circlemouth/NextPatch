import { describe, expect, it } from "vitest";
import { validateBackupJson } from "./export";

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
});
