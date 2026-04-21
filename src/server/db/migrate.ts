import { openNextPatchDatabase, type NextPatchDatabase } from "@/server/db/client";

export function migrateDatabase(target?: NextPatchDatabase | string) {
  const ownsConnection = typeof target === "string" || !target;
  const db = typeof target === "string" || !target ? openNextPatchDatabase(target) : target;

  db.exec(`
    CREATE TABLE IF NOT EXISTS local_users (
      id TEXT PRIMARY KEY,
      email TEXT,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_user_id TEXT NOT NULL REFERENCES local_users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('owner')),
      created_at TEXT NOT NULL,
      UNIQUE (workspace_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES local_users(id),
      provider TEXT NOT NULL CHECK (provider IN ('manual', 'github')),
      name TEXT NOT NULL,
      description TEXT,
      html_url TEXT,
      github_host TEXT,
      github_owner TEXT,
      github_repo TEXT,
      github_full_name TEXT,
      production_status TEXT NOT NULL,
      criticality TEXT NOT NULL,
      current_focus TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS work_items (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES local_users(id),
      repository_id TEXT REFERENCES repositories(id) ON DELETE SET NULL,
      scope TEXT NOT NULL CHECK (scope IN ('repository', 'inbox', 'global')),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      status TEXT NOT NULL,
      resolution TEXT,
      priority TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_ref TEXT,
      privacy_level TEXT NOT NULL,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      target_version_id TEXT,
      due_at TEXT,
      external_url TEXT,
      external_provider TEXT,
      external_id TEXT,
      status_changed_at TEXT,
      completed_at TEXT,
      closed_at TEXT,
      archived_at TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classification_candidates (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES local_users(id),
      memo_work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      confidence REAL NOT NULL,
      parse_source TEXT NOT NULL,
      parse_error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS status_histories (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES local_users(id),
      work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bug_details (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tech_notes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reference_services (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS work_item_tags (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS repository_versions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_repositories_workspace_active
      ON repositories(workspace_id, archived_at, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_work_items_workspace_status
      ON work_items(workspace_id, status, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_work_items_repository
      ON work_items(repository_id);
  `);

  if (ownsConnection) {
    db.close();
  }
}

