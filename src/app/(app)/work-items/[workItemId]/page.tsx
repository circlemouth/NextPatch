import { notFound } from "next/navigation";

type WorkItemDetailPageProps = {
  params: Promise<{ workItemId: string }>;
};

export default async function WorkItemDetailPage({ params }: WorkItemDetailPageProps) {
  await params;
  notFound();
}
