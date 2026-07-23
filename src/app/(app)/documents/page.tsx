import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getDataset } from "@/lib/data-access";
import DocumentUploadClient from "@/components/DocumentUploadClient";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "project_manager") redirect("/");

  const dataset = await getDataset();
  const projects = dataset.projects.map((p) => ({ id: p.id, name: p.name }));
  const teams = dataset.teams.map((t) => ({ id: t.id, name: t.name }));

  return <DocumentUploadClient projects={projects} teams={teams} />;
}
