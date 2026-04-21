import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const LOCAL_USER_ID = "local-user";
const PERSONAL_WORKSPACE_ID = "personal-workspace";
const DEFAULT_MIGRATION_DIR = path.resolve(process.cwd(), "drizzle");
const DEFAULT_DATA_DIR = "./data";
const DEFAULT_DB_FILE = "nextpatch.sqlite";

function resolveRuntimePath(value) {
  return path.isAbsolute(value) ? value : path.join(process.cwd(), value);
}

function getDataDir() {
  return resolveRuntimePath(process.env.NEXTPATCH_DATA_DIR ?? DEFAULT_DATA_DIR);
}

function getDatabasePath() {
  const explicitPath = process.env.NEXTPATCH_DB_PATH;
  return explicitPath ? resolveRuntimePath(explicitPath) : path.join(getDataDir(), DEFAULT_DB_FILE);
}

function configureSqliteDatabase(database) {
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
}

function openSqliteDatabase(dbPath = getDatabasePath()) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const database = new Database(dbPath);
  configureSqliteDatabase(database);
  return database;
}

function getMigrationFiles(migrationDir) {
  return fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

function checksumMigration(sql) {
  return crypto.createHash("sha256").update(sql).digest("hex");
}

function migrateDatabase(dbPath = getDatabasePath(), migrationDir = DEFAULT_MIGRATION_DIR) {
  const sqlite = openSqliteDatabase(dbPath);
  try {
    const files = getMigrationFiles(migrationDir);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS nextpatch_migrations (
        id TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    const appliedMigrations = sqlite
      .prepare("select id, checksum from nextpatch_migrations order by id")
      .all();
    const fileSet = new Set(files);
    const missingAppliedMigration = appliedMigrations.find((migration) => !fileSet.has(migration.id));

    if (missingAppliedMigration) {
      throw new Error(`Applied migration file is missing: ${missingAppliedMigration.id}`);
    }

    if (files.length === 0) {
      throw new Error(`No migration SQL files found in ${migrationDir}`);
    }

    const getAppliedMigration = sqlite.prepare(
      "select id, checksum from nextpatch_migrations where id = ?"
    );
    const insertMigration = sqlite.prepare(
      "insert into nextpatch_migrations (id, checksum, applied_at) values (?, ?, ?)"
    );
    const applyMigration = sqlite.transaction((file, sql, checksum) => {
      sqlite.exec(sql);
      insertMigration.run(file, checksum, new Date().toISOString());
    });

    const migrations = files.map((file) => {
      const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
      const checksum = checksumMigration(sql);
      const applied = getAppliedMigration.get(file);

      return { file, sql, checksum, applied };
    });

    for (const migration of migrations) {
      if (migration.applied && migration.applied.checksum !== migration.checksum) {
        throw new Error(
          `Migration checksum changed for ${migration.file}: expected ${migration.applied.checksum}, got ${migration.checksum}`
        );
      }
    }

    for (const migration of migrations) {
      if (migration.applied) {
        continue;
      }

      applyMigration(migration.file, migration.sql, migration.checksum);
    }
  } finally {
    sqlite.close();
  }
}

function seedDatabase(dbPath = getDatabasePath()) {
  const sqlite = openSqliteDatabase(dbPath);
  const now = new Date().toISOString();

  try {
    const seed = sqlite.transaction(() => {
      sqlite.prepare(
        "insert into local_users (id, display_name, created_at, updated_at) values (?, ?, ?, ?) on conflict do nothing"
      ).run(LOCAL_USER_ID, "Local user", now, now);
      sqlite.prepare(
        "insert into workspaces (id, owner_user_id, name, created_at, updated_at) values (?, ?, ?, ?, ?) on conflict do nothing"
      ).run(PERSONAL_WORKSPACE_ID, LOCAL_USER_ID, "Personal workspace", now, now);
      sqlite.prepare(
        "insert into workspace_members (id, workspace_id, user_id, role, created_at) values (?, ?, ?, ?, ?) on conflict do nothing"
      ).run("personal-workspace-owner", PERSONAL_WORKSPACE_ID, LOCAL_USER_ID, "owner", now);
    });

    seed();
  } finally {
    sqlite.close();
  }
}

export function initializeDatabase(dbPath = getDatabasePath(), migrationDir = DEFAULT_MIGRATION_DIR) {
  migrateDatabase(dbPath, migrationDir);
  seedDatabase(dbPath);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = getDatabasePath();
  initializeDatabase(dbPath);
  console.log(`Initialized SQLite database at ${dbPath}`);
}
