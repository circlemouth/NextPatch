import { describe, expect, it } from "vitest";
import {
  LOCAL_USER_ID,
  PERSONAL_WORKSPACE_ID,
  createSessionToken,
  getAuthConfig,
  safeNextPath,
  verifySessionToken
} from "./core";

const authConfig = {
  loginPassword: "e2e-password",
  sessionSecret: "e2e-session-secret",
  sessionMaxAgeSeconds: 60
};

describe("auth core", () => {
  it("generates and verifies session tokens", () => {
    const now = Date.UTC(2026, 0, 1, 0, 0, 0);
    const token = createSessionToken({ config: authConfig, now });

    expect(verifySessionToken(token, { config: authConfig, now: now + 1_000 })).toEqual({
      userId: LOCAL_USER_ID,
      workspaceId: PERSONAL_WORKSPACE_ID,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + authConfig.sessionMaxAgeSeconds
    });
  });

  it("rejects expired tokens", () => {
    const now = Date.UTC(2026, 0, 1, 0, 0, 0);
    const token = createSessionToken({ config: authConfig, now });

    expect(verifySessionToken(token, { config: authConfig, now: now + 61_000 })).toBeNull();
  });

  it("rejects tampered signatures", () => {
    const token = createSessionToken({ config: authConfig, now: Date.UTC(2026, 0, 1, 0, 0, 0) });
    const [version, payload, signature = ""] = token.split(".");
    const tamperedSignature = signature.slice(0, -1) + (signature.endsWith("a") ? "b" : "a");

    expect(verifySessionToken(`${version}.${payload}.${tamperedSignature}`, { config: authConfig })).toBeNull();
  });

  it("rejects external next URLs", () => {
    expect(safeNextPath("https://evil.example/login")).toBe("/dashboard");
    expect(safeNextPath("//evil.example/login")).toBe("/dashboard");
    expect(safeNextPath("/repositories?view=active")).toBe("/repositories?view=active");
  });

  it("detects missing auth configuration", () => {
    expect(() => getAuthConfig({} as unknown as NodeJS.ProcessEnv)).toThrow(
      "Missing auth configuration: NEXTPATCH_LOGIN_PASSWORD, NEXTPATCH_SESSION_SECRET"
    );
    expect(() => getAuthConfig({ NEXTPATCH_LOGIN_PASSWORD: "secret" } as unknown as NodeJS.ProcessEnv)).toThrow(
      "Missing auth configuration: NEXTPATCH_SESSION_SECRET"
    );
  });
});
