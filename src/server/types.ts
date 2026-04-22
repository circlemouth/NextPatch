export type WorkItemType = "task" | "bug" | "idea" | "implementation" | "future_feature" | "memo";
export type WorkItemScope = "repository" | "inbox" | "global";
export type Priority = "p0" | "p1" | "p2" | "p3" | "p4";
export type ProductionStatus = "planning" | "development" | "active_production" | "maintenance" | "paused";
export type Criticality = "high" | "medium" | "low";
export type SourceType = "manual" | "chatgpt" | "github" | "web" | "import" | "system";
export type PrivacyLevel = "normal" | "confidential" | "secret" | "no_ai";

export type RepositoryRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  provider: "manual" | "github";
  name: string;
  description: string | null;
  html_url: string | null;
  github_host: string | null;
  github_owner: string | null;
  github_repo: string | null;
  github_full_name: string | null;
  production_status: ProductionStatus;
  criticality: Criticality;
  current_focus: string | null;
  is_favorite: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

export type RepositorySummaryRow = RepositoryRow & {
  open_item_count: number;
  memo_count: number;
  last_activity_at: string | null;
};

export type WorkItemRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  repository_id: string | null;
  scope: WorkItemScope;
  type: WorkItemType;
  title: string;
  body: string | null;
  status: string;
  resolution: string | null;
  priority: Priority;
  source_type: SourceType;
  source_ref: string | null;
  privacy_level: PrivacyLevel;
  is_pinned: boolean;
  target_version_id: string | null;
  due_at: string | null;
  external_url: string | null;
  external_provider: "github" | null;
  external_id: string | null;
  status_changed_at: string | null;
  completed_at: string | null;
  closed_at: string | null;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  repositories?: Pick<RepositoryRow, "name" | "production_status"> | null;
};
