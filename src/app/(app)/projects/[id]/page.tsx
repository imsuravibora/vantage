import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TriangleAlert, Wallet, Milestone, ShieldAlert, Flame, ScrollText, Lock } from "lucide-react";
import { getDataset } from "@/lib/data-access";
import { computeProjectRisk, budgetVariancePct } from "@/lib/analytics";
import { getCurrentProfile } from "@/lib/auth";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import BudgetChart from "@/components/charts/BudgetChart";
import MarkdownContent from "@/components/MarkdownContent";
import TicketManager from "@/components/TicketManager";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [dataset, profile] = await Promise.all([getDataset(), getCurrentProfile()]);

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

  const teamEngineers = dataset.engineers.filter((e) => e.teamId === project.teamId);
  const ticketsWithAssignee = tickets.map((t) => ({
    ...t,
    assigneeName: dataset.engineers.find((e) => e.id === t.assigneeId)?.name ?? t.assigneeId,
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
        <Badge value={project.status} />
        <Badge value={risk.level} label={`${risk.level} risk (${risk.score})`} />
      </div>
      <p className="text-slate-500 mt-1">
        {team?.name ?? project.teamId} · {project.startDate} to {project.targetDate}
      </p>

      {risk.factors.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 uppercase tracking-wide">
            <TriangleAlert className="h-3.5 w-3.5" /> Risk factors
          </div>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-amber-900">
            {risk.factors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <SectionHeading icon={Wallet}>Budget</SectionHeading>
          <div className="mt-1 text-sm text-slate-600">
            ${project.budgetSpent.toLocaleString()} spent of ${project.budgetPlanned.toLocaleString()} planned (
            <span className={variance > 10 ? "text-red-600 font-medium" : ""}>
              {variance >= 0 ? "+" : ""}
              {variance.toFixed(0)}%
            </span>
            )
          </div>
          <BudgetChart data={[{ name: project.name, planned: project.budgetPlanned, spent: project.budgetSpent }]} />
        </Card>

        <TicketManager
          projectId={project.id}
          initialTickets={ticketsWithAssignee}
          engineers={teamEngineers.map((e) => ({ id: e.id, name: e.name }))}
          canEdit={profile?.role === "project_manager"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <SectionHeading icon={Milestone}>Milestones</SectionHeading>
          <ul className="mt-3 space-y-2 text-sm">
            {milestones.map((m) => (
              <li key={m.id} className="flex items-center justify-between">
                <span className="text-slate-700">{m.name}</span>
                <span className="flex items-center gap-2 text-slate-500">
                  {m.dueDate}
                  <Badge value={m.status} />
                </span>
              </li>
            ))}
            {milestones.length === 0 && <li className="text-slate-400">Nothing on the calendar yet</li>}
          </ul>
        </Card>

        <Card className="p-4">
          <SectionHeading icon={ShieldAlert}>Security findings</SectionHeading>
          <ul className="mt-3 space-y-2 text-sm">
            {findings.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2">
                <span className="text-slate-700">{f.packageName}</span>
                <span className="flex items-center gap-2">
                  <Badge value={f.resolved ? "resolved" : f.severity} label={f.resolved ? "resolved" : f.severity} />
                </span>
              </li>
            ))}
            {findings.length === 0 && <li className="text-slate-400">Clean bill of health — no findings here</li>}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <SectionHeading icon={Flame}>Incidents</SectionHeading>
        <ul className="mt-3 space-y-3 text-sm">
          {incidents.map((inc) => (
            <li key={inc.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">{inc.title}</span>
                <Badge value={inc.severity} />
              </div>
              <div className="text-slate-500 mt-1">
                MTTR {inc.mttrMinutes}m · {inc.rootCauseSummary}
              </div>
            </li>
          ))}
          {incidents.length === 0 && <li className="text-slate-400">Quiet quarter — nothing on fire</li>}
        </ul>
      </Card>

      <Card className="mt-6 p-4">
        <SectionHeading icon={ScrollText}>Notes &amp; retros</SectionHeading>
        <div className="mt-3 space-y-4">
          {docs.map((d) => {
            const restricted = d.confidential && profile?.role !== "management";
            return (
              <div key={d.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-slate-700">{d.title}</div>
                  {d.confidential && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-100 ring-1 ring-inset ring-slate-700">
                      <Lock className="h-3 w-3" />
                      confidential
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  {restricted ? (
                    <div className="flex items-center gap-1.5 text-sm text-slate-400 italic">
                      <Lock className="h-3.5 w-3.5" /> Confidential — restricted to Management.
                    </div>
                  ) : (
                    <MarkdownContent content={d.content} />
                  )}
                </div>
              </div>
            );
          })}
          {docs.length === 0 && (
            <div className="text-slate-400 text-sm">No notes yet — nobody&apos;s written anything down</div>
          )}
        </div>
      </Card>
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
