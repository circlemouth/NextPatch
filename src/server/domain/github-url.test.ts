import { describe, expect, it } from "vitest";
import { parseGitHubUrl } from "./github-url";

describe("parseGitHubUrl", () => {
  it("parses repository URL", () => {
    expect(parseGitHubUrl("https://github.com/openai/codex")?.githubFullName).toBe("openai/codex");
  });

  it("parses issue URL without calling GitHub API", () => {
    const parsed = parseGitHubUrl("https://github.com/owner/repo/issues/123");
    expect(parsed?.externalType).toBe("issue");
    expect(parsed?.externalId).toBe("123");
  });

  it("rejects non-https URLs", () => {
    expect(parseGitHubUrl("http://github.com/owner/repo")).toBeNull();
  });
});
