create extension if not exists pgcrypto;

create type repository_provider as enum ('manual', 'github');
create type production_status as enum ('planning', 'development', 'active_production', 'maintenance', 'paused');
create type criticality as enum ('high', 'medium', 'low');
create type work_item_scope as enum ('repository', 'inbox', 'global');
create type work_item_type as enum ('task', 'bug', 'idea', 'implementation', 'future_feature', 'memo');
create type priority_level as enum ('p0', 'p1', 'p2', 'p3', 'p4');
create type source_type as enum ('manual', 'chatgpt', 'github', 'web', 'import', 'system');
create type privacy_level as enum ('normal', 'confidential', 'secret', 'no_ai');
create type workspace_role as enum ('owner', 'member');

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role workspace_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table repository_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  repository_id uuid not null,
  name text not null,
  description text,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table repositories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider repository_provider not null default 'manual',
  name text not null,
  description text,
  html_url text,
  github_host text,
  github_owner text,
  github_repo text,
  github_full_name text,
  production_status production_status not null default 'development',
  criticality criticality not null default 'medium',
  current_focus text,
  next_version_id uuid references repository_versions(id) on delete set null,
  is_favorite boolean not null default false,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

alter table repository_versions
  add constraint repository_versions_repository_id_fkey
  foreign key (repository_id) references repositories(id) on delete cascade;

create table work_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  repository_id uuid references repositories(id) on delete set null,
  scope work_item_scope not null,
  type work_item_type not null,
  title text not null,
  body text,
  status text not null,
  resolution text,
  priority priority_level not null default 'p2',
  source_type source_type not null default 'manual',
  source_ref text,
  privacy_level privacy_level not null default 'normal',
  is_pinned boolean not null default false,
  target_version_id uuid references repository_versions(id) on delete set null,
  due_at timestamptz,
  external_url text,
  external_provider text check (external_provider is null or external_provider = 'github'),
  external_id text,
  status_changed_at timestamptz,
  completed_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_items_scope_repository_consistency check (
    (scope = 'repository' and repository_id is not null)
    or (scope in ('inbox', 'global') and repository_id is null)
  )
);

create table bug_details (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  work_item_id uuid not null references work_items(id) on delete cascade unique,
  severity text not null default 's3',
  reproduction_steps text,
  expected_result text,
  actual_result text,
  environment text,
  fixed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ideas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  work_item_id uuid not null references work_items(id) on delete cascade unique,
  value_hypothesis text,
  target_user text,
  feasibility text,
  decision text,
  promoted_work_item_id uuid references work_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tech_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  repository_id uuid references repositories(id) on delete set null,
  name text not null,
  category text,
  adoption_status text not null default 'candidate',
  reason text,
  official_url text,
  concerns text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table reference_services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  repository_id uuid references repositories(id) on delete set null,
  name text not null,
  url text,
  reference_point text,
  strengths text,
  concerns text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table work_item_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  work_item_id uuid not null references work_items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (work_item_id, tag_id)
);

create table status_histories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  work_item_id uuid not null references work_items(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table classification_candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  memo_work_item_id uuid not null references work_items(id) on delete cascade,
  target_type work_item_type not null,
  title text not null,
  body text,
  confidence text not null default 'medium',
  parse_source text,
  parse_error text,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create table export_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null,
  content_hash text,
  created_at timestamptz not null default now()
);

create table import_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'created',
  source_format text not null default 'json',
  error_message text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_updated_at before update on workspaces for each row execute function set_updated_at();
create trigger repositories_updated_at before update on repositories for each row execute function set_updated_at();
create trigger work_items_updated_at before update on work_items for each row execute function set_updated_at();
create trigger bug_details_updated_at before update on bug_details for each row execute function set_updated_at();
create trigger ideas_updated_at before update on ideas for each row execute function set_updated_at();
create trigger tech_notes_updated_at before update on tech_notes for each row execute function set_updated_at();
create trigger reference_services_updated_at before update on reference_services for each row execute function set_updated_at();
create trigger repository_versions_updated_at before update on repository_versions for each row execute function set_updated_at();

create or replace function is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table repositories enable row level security;
alter table repository_versions enable row level security;
alter table work_items enable row level security;
alter table bug_details enable row level security;
alter table ideas enable row level security;
alter table tech_notes enable row level security;
alter table reference_services enable row level security;
alter table tags enable row level security;
alter table work_item_tags enable row level security;
alter table status_histories enable row level security;
alter table classification_candidates enable row level security;
alter table export_logs enable row level security;
alter table import_jobs enable row level security;

create policy workspaces_member_select on workspaces for select using (owner_user_id = auth.uid() or is_workspace_member(id));
create policy workspaces_owner_insert on workspaces for insert with check (owner_user_id = auth.uid());
create policy workspaces_member_update on workspaces for update using (is_workspace_member(id)) with check (is_workspace_member(id));

create policy workspace_members_select on workspace_members for select using (user_id = auth.uid() or is_workspace_member(workspace_id));
create policy workspace_members_insert on workspace_members for insert with check (user_id = auth.uid());
create policy workspace_members_update on workspace_members for update using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create policy repositories_member_all on repositories for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy repository_versions_member_all on repository_versions for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy work_items_member_all on work_items for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy bug_details_member_all on bug_details for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy ideas_member_all on ideas for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy tech_notes_member_all on tech_notes for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy reference_services_member_all on reference_services for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy tags_member_all on tags for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy work_item_tags_member_all on work_item_tags for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy status_histories_member_all on status_histories for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy classification_candidates_member_all on classification_candidates for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy export_logs_member_all on export_logs for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy import_jobs_member_all on import_jobs for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

create index repositories_workspace_idx on repositories(workspace_id, updated_at desc);
create index work_items_workspace_idx on work_items(workspace_id, updated_at desc);
create index work_items_repository_idx on work_items(repository_id) where repository_id is not null;
create index work_items_inbox_idx on work_items(workspace_id, type, status) where type = 'memo';
create index status_histories_work_item_idx on status_histories(work_item_id, created_at desc);
