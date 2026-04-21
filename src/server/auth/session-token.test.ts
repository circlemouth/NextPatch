import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session-token";

describe("session tokens", () => {
  it("round-trips a signed payload", async () => {
    const token = await createSessionToken({ issuedAt: 1000, expiresAt: 2000 }, "secret");
    await expect(verifySessionToken(token, "secret", 1500)).resolves.toEqual({ issuedAt: 1000, expiresAt: 2000 });
  });

  it("rejects expired tokens", async () => {
    const token = await createSessionToken({ issuedAt: 1000, expiresAt: 2000 }, "secret");
    await expect(verifySessionToken(token, "secret", 2000)).resolves.toBeNull();
  });

  it("rejects tampered tokens", async () => {
    const token = await createSessionToken({ issuedAt: 1000, expiresAt: 2000 }, "secret");
    const [version, issuedAt, , signature] = token.split(".");
    const tampered = `${version}.${issuedAt}.2001.${signature}`;
    await expect(verifySessionToken(tampered, "secret", 1500)).resolves.toBeNull();
  });
});
