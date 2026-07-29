import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getDataset } from "@/lib/data-access";
import MyWorkClient from "@/components/MyWorkClient";

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "engineer") redirect("/");

  const dataset = await getDataset();
  const engineer = dataset.engineers.find((e) => e.profileId === profile.id);

  if (!engineer) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-sm text-slate-500">
        This account isn't linked to an engineer record yet — ask Management to check the roster.
      </div>
    );
  }

  const myTickets = dataset.tickets
    .filter((t) => t.assigneeId === engineer.id)
    .map((t) => ({
      ...t,
      projectName: dataset.projects.find((p) => p.id === t.projectId)?.name ?? t.projectId,
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const openTickets = dataset.tickets
    .filter((t) => t.assigneeId === null)
    .map((t) => ({
      ...t,
      projectName: dataset.projects.find((p) => p.id === t.projectId)?.name ?? t.projectId,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return <MyWorkClient engineerName={engineer.name} tickets={myTickets} openTickets={openTickets} />;
}
