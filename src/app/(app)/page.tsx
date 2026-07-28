import Link from "next/link";
import { getDataset } from "@/lib/data-access";
import { computeOrgSummary, computeMilestoneRollup, budgetVariancePct } from "@/lib/analytics";
import { listRecentSignals, listRecentDocumentReviews } from "@/lib/sentinel";
import { getCurrentProfile } from "@/lib/auth";
import Badge from "@/components/Badge";
import BudgetChart from "@/components/charts/BudgetChart";
import RiskDistributionChart from "@/components/charts/RiskDistributionChart";
import SignalsFeed from "@/components/SignalsFeed";
import DocumentReviewsFeed from "@/components/DocumentReviewsFeed";

export const dynamic = "force-dynamic";

function formatCurrency(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default async function DashboardPage() {
  const [dataset, signals, documentReviews, profile] = await Promise.all([
    getDataset(),
    listRecentSignals(),
    listRecentDocumentReviews(),
    getCurrentProfile(),
  ]);
  const summary = computeOrgSummary(dataset);
  const milestoneRollup = computeMilestoneRollup(dataset.milestones);

  const projectsByRisk = [...dataset.projects].sort((a, b) => {
    const ra = summary.projectRisks.find((r) => r.projectId === a.id)?.score ?? 0;
    const rb = summary.projectRisks.find((r) => r.projectId === b.id)?.score ?? 0;
    return rb - ra;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-slate-500 mt-1">Cross-project rollup across {summary.projectCounts.total} projects</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard
          label="Project status"
          value={`${summary.projectCounts.onTrack} / ${summary.projectCounts.atRisk} / ${summary.projectCounts.offTrack}`}
          sub="on-track / at-risk / off-track"
        />
        <StatCard
          label="Budget variance"
          value={`${summary.budgetVariancePct >= 0 ? "+" : ""}${summary.budgetVariancePct.toFixed(1)}%`}
          sub={`${formatCurrency(summary.budgetSpentTotal)} of ${formatCurrency(summary.budgetPlannedTotal)}`}
          tone={summary.budgetVariancePct > 10 ? "bad" : "good"}
        />
        <StatCard
          label="Open critical/high findings"
          value={String(summary.openCriticalHighFindings)}
          sub="security findings"
          tone={summary.openCriticalHighFindings > 0 ? "bad" : "good"}
        />
        <StatCard
          label="Sev1 incidents"
          value={String(summary.sev1IncidentsCount)}
          sub="this quarter"
          tone={summary.sev1IncidentsCount > 0 ? "bad" : "good"}
        />
      </div>

      <div className="mt-6">
        <SignalsFeed signals={signals} />
      </div>

      <div className="mt-6">
        <DocumentReviewsFeed reviews={documentReviews} viewerRole={profile?.role ?? "project_manager"} />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold">Budget: planned vs. spent</h3>
          <BudgetChart
            data={dataset.projects.map((p) => ({ name: p.name, planned: p.budgetPlanned, spent: p.budgetSpent }))}
          />
        </div>
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold">Risk distribution</h3>
          <RiskDistributionChart
            data={(["low", "medium", "high"] as const).map((level) => ({
              name: level,
              value: summary.projectRisks.filter((r) => r.level === level).length,
            }))}
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Projects by risk</h2>
        <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Budget variance</th>
                <th className="px-4 py-3 font-medium">Top factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectsByRisk.map((project) => {
                const risk = summary.projectRisks.find((r) => r.projectId === project.id)!;
                const variance = budgetVariancePct(project);
                return (
                  <tr key={project.id}>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/projects/${project.id}`} className="text-blue-700 hover:underline">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={project.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={risk.level} label={`${risk.level} (${risk.score})`} />
                    </td>
                    <td className={`px-4 py-3 ${variance > 10 ? "text-red-600" : "text-slate-700"}`}>
                      {variance >= 0 ? "+" : ""}
                      {variance.toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-slate-500">{risk.factors[0] ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold">Milestones</h3>
          <div className="mt-2 text-sm text-slate-600 space-y-1">
            <div>{milestoneRollup.onTrack} on-track</div>
            <div>{milestoneRollup.atRisk} at-risk</div>
            <div>{milestoneRollup.offTrack} off-track</div>
          </div>
        </div>
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold">Capacity</h3>
          <div className="mt-2 text-sm text-slate-600 space-y-1">
            <div>{summary.overloadedEngineerCount} engineer(s) overloaded</div>
            <div>{summary.underloadedEngineerCount} engineer(s) underloaded</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div
        className={`text-2xl font-bold mt-1 ${
          tone === "bad" ? "text-red-600" : tone === "good" ? "text-emerald-600" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
