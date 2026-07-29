"use client";

import { useState } from "react";
import { UserCog, Plus, X } from "lucide-react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { INPUT_CLASS, LABEL_CLASS } from "@/lib/ui";
import type { ProjectManagerOption, AssignmentRow } from "@/lib/assignments";

export default function AssignmentsClient({
  projectManagers,
  assignments,
  projects,
}: {
  projectManagers: ProjectManagerOption[];
  assignments: AssignmentRow[];
  projects: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState(assignments);
  const [profileId, setProfileId] = useState(projectManagers[0]?.id ?? "");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [assigning, setAssigning] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId || !projectId) return;
    setAssigning(true);
    setError(null);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to assign");
      const pm = projectManagers.find((p) => p.id === profileId);
      const project = projects.find((p) => p.id === projectId);
      setRows((prev) => [
        {
          id: data.id ?? Date.now(),
          profileId,
          profileName: pm?.fullName ?? pm?.email ?? profileId,
          projectId,
          projectName: project?.name ?? projectId,
          assignedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemove(id: number) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove assignment");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
        <UserCog className="h-5 w-5 text-brand-500" />
        Project assignments
      </h1>
      <p className="text-slate-500 mt-1">
        Assign each Project Manager to the projects they're staffed on. This controls which projects they can draft
        and send reports for.
      </p>

      <Card className="mt-6 p-4">
        {projectManagers.length === 0 ? (
          <div className="text-sm text-slate-400">
            No Project Manager accounts exist yet — have one sign up first.
          </div>
        ) : (
          <form onSubmit={handleAssign} className="flex flex-wrap items-end gap-3">
            <div>
              <label className={LABEL_CLASS}>Project Manager</label>
              <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className={INPUT_CLASS}>
                {projectManagers.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.fullName ?? pm.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={INPUT_CLASS}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={assigning}>
              {assigning ? "Assigning..." : "Assign"}
              {!assigning && <Plus className="h-3.5 w-3.5" />}
            </Button>
          </form>
        )}
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </Card>

      <Card className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/80 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Project Manager</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-800">{row.profileName}</td>
                <td className="px-4 py-3 text-slate-700">{row.projectName}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(row.assignedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" disabled={busyId === row.id} onClick={() => handleRemove(row.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No assignments yet — nobody's staffed on anything.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
