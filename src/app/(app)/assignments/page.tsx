import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { listProjectManagers, listAssignments } from "@/lib/assignments";
import { getDataset } from "@/lib/data-access";
import AssignmentsClient from "@/components/AssignmentsClient";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "management") redirect("/");

  const [projectManagers, assignments, dataset] = await Promise.all([
    listProjectManagers(),
    listAssignments(),
    getDataset(),
  ]);

  return (
    <AssignmentsClient
      projectManagers={projectManagers}
      assignments={assignments}
      projects={dataset.projects.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
