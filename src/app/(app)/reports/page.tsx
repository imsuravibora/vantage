import { redirect } from "next/navigation";
import { listReportsForViewer } from "@/lib/reports";
import { listFeedbackForReports } from "@/lib/feedback";
import { listAssignedProjectIds } from "@/lib/assignments";
import { getDataset } from "@/lib/data-access";
import { getCurrentProfile } from "@/lib/auth";
import ReportsClient from "@/components/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "engineer") redirect("/my-work");

  const dataset = await getDataset();
  const reports = await listReportsForViewer(profile);
  const feedback = await listFeedbackForReports(reports.map((r) => r.id));

  const assignableProjectIds =
    profile.role === "project_manager" ? new Set(await listAssignedProjectIds(profile.id)) : null;
  const projects = dataset.projects
    .filter((p) => !assignableProjectIds || assignableProjectIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <ReportsClient
      initialReports={reports}
      initialFeedback={feedback}
      projects={projects}
      currentUser={profile}
    />
  );
}
