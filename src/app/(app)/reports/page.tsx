import { redirect } from "next/navigation";
import { listReports } from "@/lib/reports";
import { listFeedbackForReports } from "@/lib/feedback";
import { getDataset } from "@/lib/data-access";
import { getCurrentProfile } from "@/lib/auth";
import ReportsClient from "@/components/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "management") redirect("/");

  const [reports, dataset] = await Promise.all([listReports(), getDataset()]);
  const feedback = await listFeedbackForReports(reports.map((r) => r.id));
  const projects = dataset.projects.map((p) => ({ id: p.id, name: p.name }));

  return (
    <ReportsClient initialReports={reports} initialFeedback={feedback} projects={projects} currentUser={profile} />
  );
}
