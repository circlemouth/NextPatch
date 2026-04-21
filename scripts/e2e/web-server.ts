import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { migrateDatabase } from "../../src/server/db/migrate";
import { seedDatabase } from "../../src/server/db/seed";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nextpatch-e2e-"));
const dbPath = path.join(tempDir, "nextpatch.e2e.sqlite");
const exportDir = path.join(tempDir, "exports");

fs.mkdirSync(exportDir, { recursive: true });

process.env.NEXTPATCH_DATA_DIR = tempDir;
process.env.NEXTPATCH_DB_PATH = dbPath;
process.env.NEXTPATCH_EXPORT_DIR = exportDir;
process.env.NEXTPATCH_RUNTIME_MODE = "e2e";
process.env.NEXTPATCH_LOGIN_PASSWORD = process.env.NEXTPATCH_LOGIN_PASSWORD ?? "e2e-password";
process.env.NEXTPATCH_SESSION_SECRET = process.env.NEXTPATCH_SESSION_SECRET ?? "e2e-session-secret";

try {
  migrateDatabase(dbPath);
  seedDatabase(dbPath);
} catch (error) {
  fs.rmSync(tempDir, { recursive: true, force: true });
  throw error;
}

const child = spawn("pnpm", ["exec", "next", "dev", "--hostname", "0.0.0.0"], {
  env: process.env,
  stdio: "inherit"
});

const shutdown = (signal: NodeJS.Signals) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("exit", () => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

child.on("exit", (code, signal) => {
  fs.rmSync(tempDir, { recursive: true, force: true });
  process.exit(code ?? (signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 0));
});
