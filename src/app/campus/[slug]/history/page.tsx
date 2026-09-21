import { notFound } from "next/navigation";
import { CampusHistoryShell } from "@/components/CampusHistoryShell";
import { campusFromSlug } from "@/lib/campus-routes";

export default async function CampusHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campus = campusFromSlug(slug);
  if (!campus) notFound();

  return <CampusHistoryShell campus={campus.name} />;
}
