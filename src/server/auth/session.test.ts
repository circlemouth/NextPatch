import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.hoisted(() => ({
  cookies: vi.fn()
}));

vi.mock("next/headers", () => headersMock);

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  })
}));

import { getAuthenticatedLocalContext } from "./session";

describe("authenticated local context", () => {
  beforeEach(() => {
    headersMock.cookies.mockReset();
  });

  it("does not grant local context when cookies are unavailable in the test runtime", async () => {
    headersMock.cookies.mockRejectedValue(new Error("next headers unavailable"));

    await expect(getAuthenticatedLocalContext()).resolves.toBeNull();
  });
});
