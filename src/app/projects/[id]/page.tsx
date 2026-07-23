import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataset } from "@/lib/data-access";
import { computeProjectRisk, budgetVariancePct } from "@/lib/analytics";
import Badge from "@/components/Badge";
import BudgetChart from "@/components/charts/BudgetChart";
import MarkdownContent from "@/components/MarkdownContent";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dataset = await getDataset();

  const project = dataset.projects.find((p) => p.id === id);
  if (!project) notFound();

  const team = dataset.teams.find((t) => t.id === project.teamId);
  const milestones = dataset.milestones.filter((m) => m.projectId === id);
  const tickets = dataset.tickets.filter((t) => t.projectId === id);
  const findings = dataset.securityFindings.filter((f) => f.projectId === id);
  const incidents = dataset.incidents.filter((i) => i.projectId === id);
  const docs = dataset.narrativeDocs.filter((d) => d.projectId === id);
  const risk = computeProjectRisk(project, milestones, findings, incidents);
  const variance = budgetVariancePct(project);

  const ticketCounts = {
    todo: tickets.filter((t) => t.status === "todo").length,
    inProgress: tickets.filter((t) => t.status === "in-progress").length,
    done: tickets.filter((t) => t.status === "done").length,
    blocked: tickets.filter((t) => t.status === "blocked").length,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/" className="text-sm text-blue-700 hover:underline">
        ← Back to dashboard
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Badge value={project.status} />
        <Badge value={risk.level} label={`${risk.level} risk (${risk.score})`} />
      </div>
      <p className="text-slate-500 mt-1">
        {team?.name ?? project.teamId} · {project.startDate} to {project.targetDate}
      </p>

      {risk.factors.length > 0 && (
        <div className="mt-4 border border-amber-200 bg-amber-50 rounded-lg p-4">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wide">Risk factors</div>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-amber-900">
            {risk.factors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold">Budget</h3>
          <div className="mt-1 text-sm text-slate-600">
            ${project.budgetSpent.toLocaleString()} spent of ${project.budgetPlanned.toLocaleString()} planned (
            <span className={variance > 10 ? "text-red-600 font-medium" : ""}>
              {variance >= 0 ? "+" : ""}
              {variance.toFixed(0)}%
            </span>
            )
          </div>
          <BudgetChart data={[{ name: project.name, planned: project.budgetPlanned, spent: project.budgetSpent }]} />
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold">Tickets</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-2xl font-bold">{ticketCounts.done}</div>
              <div className="text-slate-500">Done</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{ticketCounts.inProgress}</div>
              <div className="text-slate-500">In progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{ticketCounts.blocked}</div>
              <div className="text-slate-500">Blocked</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{ticketCounts.todo}</div>
              <div className="text-slate-500">Todo</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold">Milestones</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {milestones.map((m) => (
              <li key={m.id} className="flex items-center justify-between">
                <span>{m.name}</span>
                <span className="flex items-center gap-2 text-slate-500">
                  {m.dueDate}
                  <Badge value={m.status} />
                </span>
              </li>
            ))}
            {milestones.length === 0 && <li className="text-slate-400">No milestones</li>}
          </ul>
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold">Security findings</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {findings.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2">
                <span className="text-slate-700">{f.packageName}</span>
                <span className="flex items-center gap-2">
                  <Badge value={f.resolved ? "resolved" : f.severity} label={f.resolved ? "resolved" : f.severity} />
                </span>
              </li>
            ))}
            {findings.length === 0 && <li className="text-slate-400">No findings</li>}
          </ul>
        </div>
      </div>

      <div className="mt-6 border border-slate-200 rounded-lg p-4 bg-white">
        <h3 className="font-semibold">Incidents</h3>
        <ul className="mt-3 space-y-3 text-sm">
          {incidents.map((inc) => (
            <li key={inc.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="font-medium">{inc.title}</span>
                <Badge value={inc.severity} />
              </div>
              <div className="text-slate-500 mt-1">
                MTTR {inc.mttrMinutes}m · {inc.rootCauseSummary}
              </div>
            </li>
          ))}
          {incidents.length === 0 && <li className="text-slate-400">No incidents this quarter</li>}
        </ul>
      </div>

      <div className="mt-6 border border-slate-200 rounded-lg p-4 bg-white">
        <h3 className="font-semibold">Notes &amp; retros</h3>
        <div className="mt-3 space-y-4">
          {docs.map((d) => (
            <div key={d.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
              <div className="text-sm font-medium text-slate-700">{d.title}</div>
              <div className="mt-1">
                <MarkdownContent content={d.content} />
              </div>
            </div>
          ))}
          {docs.length === 0 && <div className="text-slate-400 text-sm">No notes for this project</div>}
        </div>
      </div>
    </div>
  );
}
