import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "@/server/db/client";

migrate(getDb(), { migrationsFolder: "drizzle" });

console.log("SQLite migrations applied.");
