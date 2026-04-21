import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SESSION_MAX_AGE_SECONDS, getAuthConfig } from "./config";

const originalEnv = process.env;

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getAuthConfig", () => {
  it("detects missing auth configuration", () => {
    process.env = {};
    expect(getAuthConfig()).toBeNull();

    process.env = { NEXTPATCH_LOGIN_PASSWORD: "password" };
    expect(getAuthConfig()).toBeNull();
  });

  it("uses defaults for optional settings", () => {
    process.env = {
      NEXTPATCH_LOGIN_PASSWORD: "password",
      NEXTPATCH_SESSION_SECRET: "secret"
    };

    expect(getAuthConfig()).toEqual({
      loginPassword: "password",
      sessionSecret: "secret",
      sessionMaxAgeSeconds: DEFAULT_SESSION_MAX_AGE_SECONDS,
      cookieSecure: false
    });
  });
}
