import { Gauge } from "lucide-react";
import { getDataset } from "@/lib/data-access";
import { computeEngineerCapacity } from "@/lib/analytics";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import CapacityChart from "@/components/charts/CapacityChart";

export const dynamic = "force-dynamic";

export default async function CapacityPage() {
  const dataset = await getDataset();

  const rows = dataset.engineers.map((e) => ({
    ...computeEngineerCapacity(e, dataset.allocations),
    teamName: dataset.teams.find((t) => t.id === e.teamId)?.name ?? e.teamId,
    role: e.role,
  }));

  const byTeam = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byTeam.get(row.teamName) ?? [];
    list.push(row);
    byTeam.set(row.teamName, list);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
        <Gauge className="h-5 w-5 text-brand-500" />
        Capacity
      </h1>
      <p className="text-slate-500 mt-1">
        Average allocation vs. weekly capacity over the last 8 weeks — a resourcing view, not a productivity ranking.
      </p>

      <Card className="mt-6 p-4">
        <h2 className="font-semibold text-slate-900">Utilization by engineer</h2>
        <CapacityChart
          data={rows.map((r) => ({ name: r.name, utilizationPct: r.utilizationPct, status: r.status }))}
        />
      </Card>

      <div className="mt-8 space-y-8">
        {[...byTeam.entries()].map(([teamName, teamRows]) => (
          <div key={teamName}>
            <h2 className="text-lg font-semibold text-slate-900">{teamName}</h2>
            <Card className="mt-2 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/80 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Engineer</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Weekly capacity</th>
                    <th className="px-4 py-3 font-medium">Avg. allocated</th>
                    <th className="px-4 py-3 font-medium">Utilization</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamRows.map((row) => (
                    <tr key={row.engineerId} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                      <td className="px-4 py-3 text-slate-500">{row.role}</td>
                      <td className="px-4 py-3 text-slate-700">{row.weeklyCapacityHours}h</td>
                      <td className="px-4 py-3 text-slate-700">{row.avgAllocatedHours}h</td>
                      <td className="px-4 py-3 text-slate-700">{row.utilizationPct}%</td>
                      <td className="px-4 py-3">
                        <Badge value={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
