import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { getDataDir, getDbPath, getExportDir } from "@/server/db/paths";

let database: Database.Database | null = null;

export function getDb() {
  if (!database) {
    fs.mkdirSync(getDataDir(), { recursive: true });
    fs.mkdirSync(getExportDir(), { recursive: true });

    database = new Database(getDbPath());
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    database.pragma("busy_timeout = 5000");
    ensureSchema(database);
    seedLocalContext(database);
  }

  return database;
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    create table if not exists workspaces (
      id text primary key,
      owner_user_id text not null,
      name text not null,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now')),
      archived_at text,
      deleted_at text
    );

    create table if not exists workspace_members (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      role text not null default 'owner',
      created_at text not null default (datetime('now')),
      unique (workspace_id, user_id)
    );

    create table if not exists repository_versions (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      repository_id text not null,
      name text not null,
      description text,
      target_date text,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now')),
      archived_at text,
      deleted_at text
    );

    create table if not exists repositories (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      provider text not null default 'manual',
      name text not null,
      description text,
      html_url text,
      github_host text,
      github_owner text,
      github_repo text,
      github_full_name text,
      production_status text not null default 'development',
      criticality text not null default 'medium',
      current_focus text,
      next_version_id text,
      is_favorite integer not null default 0,
      sort_order integer,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now')),
      archived_at text,
      deleted_at text
    );

    create table if not exists work_items (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      repository_id text,
      scope text not null,
      type text not null,
      title text not null,
      body text,
      status text not null,
      resolution text,
      priority text not null default 'p2',
      source_type text not null default 'manual',
      source_ref text,
      privacy_level text not null default 'normal',
      is_pinned integer not null default 0,
      target_version_id text,
      due_at text,
      external_url text,
      external_provider text,
      external_id text,
      status_changed_at text,
      completed_at text,
      closed_at text,
      archived_at text,
      deleted_at text,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now')),
      check (
        (scope = 'repository' and repository_id is not null)
        or (scope in ('inbox', 'global') and repository_id is null)
      )
    );

    create table if not exists bug_details (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      work_item_id text not null unique,
      severity text not null default 's3',
      reproduction_steps text,
      expected_result text,
      actual_result text,
      environment text,
      fixed_at text,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now'))
    );

    create table if not exists ideas (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      work_item_id text not null unique,
      value_hypothesis text,
      target_user text,
      feasibility text,
      decision text,
      promoted_work_item_id text,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now'))
    );

    create table if not exists tech_notes (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      repository_id text,
      name text not null,
      category text,
      adoption_status text not null default 'candidate',
      reason text,
      official_url text,
      concerns text,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now')),
      archived_at text,
      deleted_at text
    );

    create table if not exists reference_services (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      repository_id text,
      name text not null,
      url text,
      reference_point text,
      strengths text,
      concerns text,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now')),
      archived_at text,
      deleted_at text
    );

    create table if not exists tags (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      name text not null,
      color text,
      created_at text not null default (datetime('now')),
      unique (workspace_id, name)
    );

    create table if not exists work_item_tags (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      work_item_id text not null,
      tag_id text not null,
      created_at text not null default (datetime('now')),
      unique (work_item_id, tag_id)
    );

    create table if not exists status_histories (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      work_item_id text not null,
      from_status text,
      to_status text not null,
      reason text,
      created_at text not null default (datetime('now'))
    );

    create table if not exists classification_candidates (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      memo_work_item_id text not null,
      target_type text not null,
      title text not null,
      body text,
      confidence text not null default 'medium',
      parse_source text,
      parse_error text,
      applied_at text,
      created_at text not null default (datetime('now'))
    );

    create table if not exists export_logs (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      format text not null,
      content_hash text,
      created_at text not null default (datetime('now'))
    );

    create table if not exists import_jobs (
      id text primary key,
      workspace_id text not null,
      user_id text not null,
      status text not null default 'created',
      source_format text not null default 'json',
      error_message text,
      created_at text not null default (datetime('now')),
      finished_at text
    );
  `);
}

function seedLocalContext(db: Database.Database) {
  const now = new Date().toISOString();
  const workspaceId = "personal-workspace";
  const userId = "local-user";

  db.prepare(
    `
      insert into workspaces (id, owner_user_id, name, created_at, updated_at)
      values (@id, @ownerUserId, @name, @now, @now)
      on conflict(id) do update set
        owner_user_id = excluded.owner_user_id,
        name = excluded.name,
        updated_at = excluded.updated_at
    `
  ).run({
    id: workspaceId,
    ownerUserId: userId,
    name: "Personal workspace",
    now
  });

  db.prepare(
    `
      insert into workspace_members (id, workspace_id, user_id, role, created_at)
      values (@id, @workspaceId, @userId, 'owner', @now)
      on conflict(workspace_id, user_id) do update set role = 'owner'
    `
  ).run({
    id: "local-owner-membership",
    workspaceId,
    userId,
    now
  });
}

export function ensureParentDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}
