PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS local_users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS repository_versions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'manual' CHECK (provider IN ('manual', 'github')),
  name TEXT NOT NULL,
  description TEXT,
  html_url TEXT,
  github_host TEXT,
  github_owner TEXT,
  github_repo TEXT,
  github_full_name TEXT,
  production_status TEXT NOT NULL DEFAULT 'development' CHECK (production_status IN ('planning', 'development', 'active_production', 'maintenance', 'paused')),
  criticality TEXT NOT NULL DEFAULT 'medium' CHECK (criticality IN ('high', 'medium', 'low')),
  current_focus TEXT,
  next_version_id TEXT REFERENCES repository_versions(id) ON DELETE SET NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
  sort_order INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  repository_id TEXT REFERENCES repositories(id) ON DELETE SET NULL,
  scope TEXT NOT NULL CHECK (scope IN ('repository', 'inbox', 'global')),
  type TEXT NOT NULL CHECK (type IN ('task', 'bug', 'idea', 'implementation', 'future_feature', 'memo')),
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL,
  resolution TEXT,
  priority TEXT NOT NULL DEFAULT 'p2' CHECK (priority IN ('p0', 'p1', 'p2', 'p3', 'p4')),
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'chatgpt', 'github', 'web', 'import', 'system')),
  source_ref TEXT,
  privacy_level TEXT NOT NULL DEFAULT 'normal' CHECK (privacy_level IN ('normal', 'confidential', 'secret', 'no_ai')),
  is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  target_version_id TEXT REFERENCES repository_versions(id) ON DELETE SET NULL,
  due_at TEXT,
  external_url TEXT,
  external_provider TEXT CHECK (external_provider IS NULL OR external_provider = 'github'),
  external_id TEXT,
  status_changed_at TEXT,
  completed_at TEXT,
  closed_at TEXT,
  archived_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    (scope = 'repository' AND repository_id IS NOT NULL)
    OR (scope IN ('inbox', 'global') AND repository_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS bug_details (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  work_item_id TEXT NOT NULL UNIQUE REFERENCES work_items(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 's3',
  reproduction_steps TEXT,
  expected_result TEXT,
  actual_result TEXT,
  environment TEXT,
  fixed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  work_item_id TEXT NOT NULL UNIQUE REFERENCES work_items(id) ON DELETE CASCADE,
  value_hypothesis TEXT,
  target_user TEXT,
  feasibility TEXT,
  decision TEXT,
  promoted_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tech_notes (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  repository_id TEXT REFERENCES repositories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  adoption_status TEXT NOT NULL DEFAULT 'candidate',
  reason TEXT,
  official_url TEXT,
  concerns TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS reference_services (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  repository_id TEXT REFERENCES repositories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  url TEXT,
  reference_point TEXT,
  strengths TEXT,
  concerns TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS work_item_tags (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE (work_item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS status_histories (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classification_candidates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  memo_work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('task', 'bug', 'idea', 'implementation', 'future_feature', 'memo')),
  title TEXT NOT NULL,
  body TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  parse_source TEXT,
  parse_error TEXT,
  applied_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS export_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  content_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'created',
  source_format TEXT NOT NULL DEFAULT 'json',
  error_message TEXT,
  created_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS repositories_workspace_idx ON repositories(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS work_items_workspace_idx ON work_items(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS work_items_repository_idx ON work_items(repository_id) WHERE repository_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS work_items_inbox_idx ON work_items(workspace_id, type, status) WHERE type = 'memo';
CREATE INDEX IF NOT EXISTS status_histories_work_item_idx ON status_histories(work_item_id, created_at DESC);
