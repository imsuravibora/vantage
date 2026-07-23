import { getSupabase } from "./supabase";
import { getDataset } from "./data-access";
import { computeOrgSummary, computeProjectRisk, budgetVariancePct } from "./analytics";
import { completeChat } from "./groq";
import type { ReportStatus } from "./types";

export interface ReportRow {
  id: number;
  project_id: string | null;
  title: string;
  draft_content: string;
  final_content: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

const REPORT_SYSTEM_PROMPT = `You are Vantage, an AI assistant drafting an executive status report for engineering leadership. Write 3-5 short paragraphs: overall status, key risks, and a clear recommendation. Use ONLY the facts provided — do not invent numbers, incidents, or details not given to you. Be direct and specific, written for a director-level audience with limited time.`;

export async function draftExecutiveReport(projectId?: string): Promise<ReportRow> {
  const dataset = await getDataset();

  let facts: string;
  let title: string;

  if (projectId) {
    const project = dataset.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Unknown project id: ${projectId}`);

    const milestones = dataset.milestones.filter((m) => m.projectId === projectId);
    const findings = dataset.securityFindings.filter((f) => f.projectId === projectId);
    const incidents = dataset.incidents.filter((i) => i.projectId === projectId);
    const docs = dataset.narrativeDocs.filter((d) => d.projectId === projectId);
    const risk = computeProjectRisk(project, milestones, findings, incidents);
    const variance = budgetVariancePct(project);

    facts =
      `Project: ${project.name}\n` +
      `Status: ${project.status}\n` +
      `Risk score: ${risk.score}/100 (${risk.level})\n` +
      `Risk factors: ${risk.factors.join("; ") || "none"}\n` +
      `Budget: $${project.budgetSpent.toLocaleString()} spent of $${project.budgetPlanned.toLocaleString()} planned (${variance >= 0 ? "+" : ""}${variance.toFixed(0)}%)\n` +
      `Milestones: ${milestones.map((m) => `${m.name} (${m.status}, due ${m.dueDate})`).join("; ") || "none"}\n` +
      `Open critical/high security findings: ${findings.filter((f) => !f.resolved && (f.severity === "critical" || f.severity === "high")).length}\n` +
      `Incidents this quarter: ${incidents.map((i) => `${i.severity} — ${i.title}`).join("; ") || "none"}\n\n` +
      `Recent notes:\n${docs.map((d) => `- ${d.title}: ${d.content}`).join("\n")}`;

    title = `${project.name} — Executive Summary`;
  } else {
    const summary = computeOrgSummary(dataset);
    const topRisks = summary.projectRisks.slice(0, 3).map((r) => {
      const p = dataset.projects.find((pr) => pr.id === r.projectId)!;
      return `${p.name}: risk ${r.score}/100 (${r.level}) — ${r.factors.join("; ") || "no major factors"}`;
    });

    facts =
      `Projects: ${summary.projectCounts.total} total — ${summary.projectCounts.onTrack} on-track, ${summary.projectCounts.atRisk} at-risk, ${summary.projectCounts.offTrack} off-track\n` +
      `Total budget: $${summary.budgetSpentTotal.toLocaleString()} spent of $${summary.budgetPlannedTotal.toLocaleString()} planned (${summary.budgetVariancePct >= 0 ? "+" : ""}${summary.budgetVariancePct.toFixed(0)}%)\n` +
      `Open critical/high security findings across all projects: ${summary.openCriticalHighFindings}\n` +
      `Sev1 incidents this quarter: ${summary.sev1IncidentsCount}\n` +
      `Engineer capacity: ${summary.overloadedEngineerCount} overloaded, ${summary.underloadedEngineerCount} underloaded\n\n` +
      `Highest-risk projects:\n${topRisks.join("\n")}`;

    title = `Org-Wide Executive Summary — ${new Date().toISOString().slice(0, 10)}`;
  }

  const draftContent = await completeChat([
    { role: "system", content: REPORT_SYSTEM_PROMPT },
    { role: "user", content: facts },
  ]);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      project_id: projectId ?? null,
      title,
      draft_content: draftContent,
      status: "pending-review",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save report: ${error.message}`);
  return data as ReportRow;
}

export async function listReports(status?: ReportStatus): Promise<ReportRow[]> {
  const supabase = getSupabase();
  let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list reports: ${error.message}`);
  return (data ?? []) as ReportRow[];
}

export async function reviewReport(
  id: number,
  action: "approve" | "reject",
  reviewerName: string,
  editedContent?: string
): Promise<ReportRow> {
  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase.from("reports").select("*").eq("id", id).single();
  if (fetchError || !existing) throw new Error(`Report ${id} not found`);
  if (existing.status !== "pending-review") {
    throw new Error(`Report ${id} is already ${existing.status}, cannot review again`);
  }

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      final_content: action === "approve" ? editedContent ?? existing.draft_content : null,
      reviewed_by: reviewerName,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update report: ${error.message}`);
  return data as ReportRow;
}
