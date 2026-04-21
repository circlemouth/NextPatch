import type { Criticality, PrivacyLevel, ProductionStatus, RepositoryRow, SourceType, WorkItemRow, WorkItemScope, WorkItemType } from "@/server/types";
import type { repositories, workItems } from "@/server/db/schema";

type RepositorySelect = typeof repositories.$inferSelect;
type WorkItemSelect = typeof workItems.$inferSelect;

export function toRepositoryRow(repository: RepositorySelect): RepositoryRow {
  return {
    id: repository.id,
    workspace_id: repository.workspaceId,
    user_id: repository.userId,
    provider: repository.provider as RepositoryRow["provider"],
    name: repository.name,
    description: repository.description,
    html_url: repository.htmlUrl,
    github_host: repository.githubHost,
    github_owner: repository.githubOwner,
    github_repo: repository.githubRepo,
    github_full_name: repository.githubFullName,
    production_status: repository.productionStatus as ProductionStatus,
    criticality: repository.criticality as Criticality,
    current_focus: repository.currentFocus,
    is_favorite: repository.isFavorite,
    sort_order: repository.sortOrder,
    created_at: repository.createdAt,
    updated_at: repository.updatedAt,
    archived_at: repository.archivedAt,
    deleted_at: repository.deletedAt
  };
}

export function toWorkItemRow(
  item: WorkItemSelect,
  repository?: { name: string | null; productionStatus?: string | null } | null
): WorkItemRow {
  return {
    id: item.id,
    workspace_id: item.workspaceId,
    user_id: item.userId,
    repository_id: item.repositoryId,
    scope: item.scope as WorkItemScope,
    type: item.type as WorkItemType,
    title: item.title,
    body: item.body,
    status: item.status,
    resolution: item.resolution,
    priority: item.priority as WorkItemRow["priority"],
    source_type: item.sourceType as SourceType,
    source_ref: item.sourceRef,
    privacy_level: item.privacyLevel as PrivacyLevel,
    is_pinned: item.isPinned,
    target_version_id: item.targetVersionId,
    due_at: item.dueAt,
    external_url: item.externalUrl,
    external_provider: item.externalProvider as WorkItemRow["external_provider"],
    external_id: item.externalId,
    status_changed_at: item.statusChangedAt,
    completed_at: item.completedAt,
    closed_at: item.closedAt,
    archived_at: item.archivedAt,
    deleted_at: item.deletedAt,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    repositories: repository?.name
      ? {
          name: repository.name,
          production_status: (repository.productionStatus ?? "development") as ProductionStatus
        }
      : null
  };
}

export function toPlainRow(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`), entry])
  );
}
