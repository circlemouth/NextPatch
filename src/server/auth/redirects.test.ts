import { describe, expect, it } from "vitest";
import { getLoginPath, isProtectedPath, isPublicPath, sanitizeNextPath } from "./redirects";

describe("sanitizeNextPath", () => {
  it("keeps internal paths", () => {
    expect(sanitizeNextPath("/dashboard?tab=summary")).toBe("/dashboard?tab=summary");
  });

  it("rejects external URLs", () => {
    expect(sanitizeNextPath("https://evil.example")).toBe("/dashboard");
  });

  it("rejects protocol-relative URLs", () => {
    expect(sanitizeNextPath("//evil.example")).toBe("/dashboard");
  });
});

describe("path guards", () => {
  it("treats app routes as protected", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/api/export/json")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("treats static assets as public", () => {
    expect(isPublicPath("/_next/static/chunk.js")).toBe(true);
    expect(isPublicPath("/favicon.ico")).toBe(true);
    expect(isPublicPath("/robots.txt")).toBe(true);
  });
});

describe("getLoginPath", () => {
  it("builds a safe login redirect path", () => {
    expect(getLoginPath("/settings?tab=data", "invalid")).toBe("/login?next=%2Fsettings%3Ftab%3Ddata&error=invalid");
  });
});
