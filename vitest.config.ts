import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

process.env.NEXTPATCH_LOGIN_PASSWORD = process.env.NEXTPATCH_LOGIN_PASSWORD ?? "test-password";
process.env.NEXTPATCH_SESSION_SECRET = process.env.NEXTPATCH_SESSION_SECRET ?? "test-session-secret";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/vitest.setup.ts"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
