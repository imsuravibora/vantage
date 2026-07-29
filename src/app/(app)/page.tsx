import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Wallet, ShieldAlert, Flame, BarChart3, PieChart, Milestone, Users, ArrowRight, Lightbulb, TrendingUp } from "lucide-react";
import { getDataset } from "@/lib/data-access";
import { computeOrgSummary, computeMilestoneRollup, budgetVariancePct } from "@/lib/analytics";
import { listRecentSignals, listRecentDocumentReviews } from "@/lib/sentinel";
import { getCurrentProfile } from "@/lib/auth";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import BudgetChart from "@/components/charts/BudgetChart";
import RiskDistributionChart from "@/components/charts/RiskDistributionChart";
import SignalsFeed from "@/components/SignalsFeed";
import DocumentReviewsFeed from "@/components/DocumentReviewsFeed";

export const dynamic = "force-dynamic";

function formatCurrency(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [dataset, signals, documentReviews] = await Promise.all([
    getDataset(),
    listRecentSignals(),
    listRecentDocumentReviews(),
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
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mt-1">Cross-project rollup across {summary.projectCounts.total} projects</p>

      <Card className="mt-6 p-5 border-brand-200/70 bg-brand-50/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/25">
              <Lightbulb className="h-4.5 w-4.5 text-brand-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Signals explain themselves</div>
              <div className="text-sm text-slate-600 mt-0.5">
                Every item in Signals below comes with a plain-language "Why" grounded in the actual evidence the
                Sentinel read — not just a flag, an explanation.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/25">
              <TrendingUp className="h-4.5 w-4.5 text-brand-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Real delivery forecasting</div>
              <div className="text-sm text-slate-600 mt-0.5">
                Every project page projects whether it'll hit its deadline from actual ticket velocity — not just
                whatever status the PM typed in.
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard
          icon={Activity}
          label="Project status"
          value={`${summary.projectCounts.onTrack} / ${summary.projectCounts.atRisk} / ${summary.projectCounts.offTrack}`}
          sub="on-track / at-risk / off-track"
        />
        <StatCard
          icon={Wallet}
          label="Budget variance"
          value={`${summary.budgetVariancePct >= 0 ? "+" : ""}${summary.budgetVariancePct.toFixed(1)}%`}
          sub={`${formatCurrency(summary.budgetSpentTotal)} of ${formatCurrency(summary.budgetPlannedTotal)}`}
          tone={summary.budgetVariancePct > 10 ? "bad" : "good"}
        />
        <StatCard
          icon={ShieldAlert}
          label="Open critical/high findings"
          value={String(summary.openCriticalHighFindings)}
          sub="security findings"
          tone={summary.openCriticalHighFindings > 0 ? "bad" : "good"}
        />
        <StatCard
          icon={Flame}
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
        <Card className="p-4">
          <SectionHeading icon={BarChart3}>Budget: planned vs. spent</SectionHeading>
          <BudgetChart
            data={dataset.projects.map((p) => ({ name: p.name, planned: p.budgetPlanned, spent: p.budgetSpent }))}
          />
        </Card>
        <Card className="p-4">
          <SectionHeading icon={PieChart}>Risk distribution</SectionHeading>
          <RiskDistributionChart
            data={(["low", "medium", "high"] as const).map((level) => ({
              name: level,
              value: summary.projectRisks.filter((r) => r.level === level).length,
            }))}
          />
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Projects by risk</h2>
        <Card className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/80 text-left text-slate-500">
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
                  <tr key={project.id} className="group transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 text-slate-800 hover:text-brand-600"
                      >
                        {project.name}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={project.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={risk.level} label={`${risk.level} (${risk.score})`} />
                    </td>
                    <td className={`px-4 py-3 ${variance > 10 ? "text-red-600 font-medium" : "text-slate-700"}`}>
                      {variance >= 0 ? "+" : ""}
                      {variance.toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-slate-500">{risk.factors[0] ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <SectionHeading icon={Milestone}>Milestones</SectionHeading>
          <div className="mt-3 text-sm text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {milestoneRollup.onTrack} on-track
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {milestoneRollup.atRisk} at-risk
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {milestoneRollup.offTrack} off-track
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <SectionHeading icon={Users}>Capacity</SectionHeading>
          <div className="mt-3 text-sm text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {summary.overloadedEngineerCount} engineer(s)
              overloaded
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {summary.underloadedEngineerCount}{" "}
              engineer(s) underloaded
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
      <Icon className="h-4 w-4 text-slate-400" />
      {children}
    </h3>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad";
}) {
  return (
    <Card hover className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <Icon className={`h-4 w-4 ${tone === "bad" ? "text-red-500" : tone === "good" ? "text-emerald-500" : "text-slate-400"}`} />
      </div>
      <div
        className={`text-2xl font-semibold mt-1.5 tracking-tight ${
          tone === "bad" ? "text-red-600" : tone === "good" ? "text-emerald-600" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </Card>
  );
}
