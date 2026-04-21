import { spawn } from "node:child_process";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeDatabase } from "./db-init.mjs";

function forwardSignal(signal, child) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

export function childExitCode(code, signal) {
  if (typeof code === "number") {
    return code;
  }

  if (signal === "SIGTERM") {
    return 143;
  }

  if (signal === "SIGINT") {
    return 130;
  }

  return 1;
}

export function main() {
  try {
    initializeDatabase();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    stdio: "inherit"
  });

  forwardSignal("SIGTERM", child);
  forwardSignal("SIGINT", child);

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    process.exit(childExitCode(code, signal));
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
