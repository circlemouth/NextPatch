import { describe, expect, it } from "vitest";
import { getLoginPath, isProtectedPath, isPublicPath, sanitizeNextPath } from "./redirects";

describe("sanitizeNextPath", () => {
  it("uses repositories as the default fallback", () => {
    expect(sanitizeNextPath(undefined)).toBe("/repositories");
    expect(sanitizeNextPath(null)).toBe("/repositories");
    expect(sanitizeNextPath("   ")).toBe("/repositories");
  });

  it("keeps internal paths", () => {
    expect(sanitizeNextPath("/repositories?tab=summary")).toBe("/repositories?tab=summary");
  });

  it("rejects normalized protocol-relative paths", () => {
    expect(sanitizeNextPath("/..//evil.example")).toBe("/repositories");
    expect(sanitizeNextPath("/%2e%2e//evil.example")).toBe("/repositories");
  });

  it("rejects external URLs", () => {
    expect(sanitizeNextPath("https://evil.example")).toBe("/repositories");
  });

  it("rejects protocol-relative URLs", () => {
    expect(sanitizeNextPath("//evil.example")).toBe("/repositories");
  });
});

describe("path guards", () => {
  it("treats app routes as protected", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/repositories")).toBe(true);
    expect(isProtectedPath("/api/export/json")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("treats static assets as public", () => {
    expect(isPublicPath("/_next/static/chunk.js")).toBe(true);
    expect(isPublicPath("/favicon.ico")).toBe(true);
    expect(isPublicPath("/robots.txt")).toBe(true);
  });

  it("does not treat dotted app paths as public", () => {
    expect(isPublicPath("/repositories/foo.bar")).toBe(false);
  });
});

describe("getLoginPath", () => {
  it("builds a safe login redirect path", () => {
    expect(getLoginPath("/settings?tab=data", "invalid")).toBe("/login?next=%2Fsettings%3Ftab%3Ddata&error=invalid");
  });
});
