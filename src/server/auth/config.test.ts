import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SESSION_MAX_AGE_SECONDS, getAuthConfig } from "./config";

const originalLoginPassword = process.env.NEXTPATCH_LOGIN_PASSWORD;
const originalSessionSecret = process.env.NEXTPATCH_SESSION_SECRET;
const originalSessionMaxAgeSeconds = process.env.NEXTPATCH_SESSION_MAX_AGE_SECONDS;
const originalCookieSecure = process.env.NEXTPATCH_COOKIE_SECURE;

afterEach(() => {
  process.env.NEXTPATCH_LOGIN_PASSWORD = originalLoginPassword;
  process.env.NEXTPATCH_SESSION_SECRET = originalSessionSecret;
  process.env.NEXTPATCH_SESSION_MAX_AGE_SECONDS = originalSessionMaxAgeSeconds;
  process.env.NEXTPATCH_COOKIE_SECURE = originalCookieSecure;
});

describe("getAuthConfig", () => {
  it("detects missing auth configuration", () => {
    delete process.env.NEXTPATCH_LOGIN_PASSWORD;
    delete process.env.NEXTPATCH_SESSION_SECRET;
    expect(getAuthConfig()).toBeNull();

    process.env.NEXTPATCH_LOGIN_PASSWORD = "password";
    expect(getAuthConfig()).toBeNull();
  });

  it("uses defaults for optional settings", () => {
    process.env.NEXTPATCH_LOGIN_PASSWORD = "password";
    process.env.NEXTPATCH_SESSION_SECRET = "secret";
    delete process.env.NEXTPATCH_SESSION_MAX_AGE_SECONDS;
    delete process.env.NEXTPATCH_COOKIE_SECURE;

    expect(getAuthConfig()).toEqual({
      loginPassword: "password",
      sessionSecret: "secret",
      sessionMaxAgeSeconds: DEFAULT_SESSION_MAX_AGE_SECONDS,
      cookieSecure: false
    });
  });
});
