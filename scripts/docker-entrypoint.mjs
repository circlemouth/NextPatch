import { spawn } from "node:child_process";
import process from "node:process";
import { initializeDatabase } from "./db-init.mjs";

function forwardSignal(signal, child) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

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
  if (signal) {
    process.exit(1);
  }

  process.exit(code ?? 1);
});
