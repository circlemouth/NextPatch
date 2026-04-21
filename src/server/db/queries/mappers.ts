import type { RepositoryRow, WorkItemRow } from "@/server/types";

type DbRepositoryRow = Omit<RepositoryRow, "is_favorite"> & {
  is_favorite: number | boolean;
};

type WorkItemJoinedRow = Omit<WorkItemRow, "is_pinned" | "repositories"> & {
  is_pinned: number | boolean;
  repository_name?: string | null;
  repository_production_status?: RepositoryRow["production_status"] | null;
};

export function mapRepository(row: DbRepositoryRow): RepositoryRow {
  return {
    ...row,
    is_favorite: Boolean(row.is_favorite)
  };
}

export function mapWorkItem(row: WorkItemJoinedRow): WorkItemRow {
  const { repository_name: repositoryName, repository_production_status: repositoryProductionStatus, ...item } = row;

  return {
    ...item,
    is_pinned: Boolean(row.is_pinned),
    repositories: repositoryName
      ? {
          name: repositoryName,
          production_status: repositoryProductionStatus ?? "development"
        }
      : null
  };
}
