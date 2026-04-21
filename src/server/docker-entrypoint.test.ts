// @vitest-environment node

import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const entrypoint = (await import(pathToFileURL(path.join(process.cwd(), "scripts/docker-entrypoint.mjs")).href)) as {
  childExitCode: (code: number | null | undefined, signal: NodeJS.Signals | null | undefined) => number;
};

describe("Docker entrypoint child exit handling", () => {
  it("maps SIGTERM to the Docker signal exit code", () => {
    expect(entrypoint.childExitCode(null, "SIGTERM")).toBe(143);
  });

  it("maps SIGINT to the interrupt exit code", () => {
    expect(entrypoint.childExitCode(null, "SIGINT")).toBe(130);
  });

  it("preserves normal child exit codes", () => {
    expect(entrypoint.childExitCode(0, null)).toBe(0);
    expect(entrypoint.childExitCode(42, null)).toBe(42);
  });

  it("falls back to 1 when code and signal are absent", () => {
    expect(entrypoint.childExitCode(null, null)).toBe(1);
  });
});
