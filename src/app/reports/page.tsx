import { listReports } from "@/lib/reports";
import { getDataset } from "@/lib/data-access";
import ReportsClient from "@/components/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [reports, dataset] = await Promise.all([listReports(), getDataset()]);
  const projects = dataset.projects.map((p) => ({ id: p.id, name: p.name }));

  return <ReportsClient initialReports={reports} projects={projects} />;
}
