import { notFound } from "next/navigation";

type RepositoryDetailPageProps = {
  params: Promise<{ repositoryId: string }>;
};

export default async function RepositoryDetailPage({ params }: RepositoryDetailPageProps) {
  await params;
  notFound();
}
