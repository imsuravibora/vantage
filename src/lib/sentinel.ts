import { getSupabase } from "./supabase-admin";
import { completeJson } from "./groq";
import type { SignalSource, SignalSeverity, DocumentReviewWithMeta } from "./types";

export interface SignalWithProject {
  id: number;
  projectId: string;
  projectName: string;
  source: SignalSource;
  severity: SignalSeverity;
  summary: string;
  escalatedReportId: number | null;
  createdAt: string;
}

export async function listRecentSignals(limit = 20): Promise<SignalWithProject[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("signals")
    .select("*, projects(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list signals: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    projectName: (row as unknown as { projects: { name: string } | null }).projects?.name ?? row.project_id,
    source: row.source,
    severity: row.severity,
    summary: row.summary,
    escalatedReportId: row.escalated_report_id,
    createdAt: row.created_at,
  }));
}

export async function recordSignal(
  projectId: string,
  source: SignalSource,
  sourceId: string,
  severity: SignalSeverity,
  summary: string
) {
  const supabase = getSupabase();

  let escalatedReportId: number | null = null;
  if (severity === "major") {
    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).single();
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        project_id: projectId,
        title: `⚠ Risk detected — ${project?.name ?? projectId}`,
        draft_content: `The Sentinel flagged a new risk signal:\n\n${summary}\n\nThis was detected automatically and needs a human review before it's treated as confirmed.`,
        status: "pending-review",
      })
      .select()
      .single();
    if (!reportError && report) escalatedReportId = report.id;
    else if (reportError) console.error("[sentinel] failed to escalate to report:", reportError.message);
  }

  const { error } = await supabase.from("signals").insert({
    project_id: projectId,
    source,
    source_id: sourceId,
    severity,
    summary,
    escalated_report_id: escalatedReportId,
  });
  if (error) console.error("[sentinel] failed to record signal:", error.message);
}

// Rule-based -- a ticket going blocked is unambiguous, no AI judgment needed.
export async function flagBlockedTicket(ticketId: string, projectId: string, title: string) {
  await recordSignal(projectId, "ticket", ticketId, "minor", `Ticket blocked: "${title}"`);
}

export interface DocumentReviewResult {
  compliance: string[];
  security: string[];
  timelines: string[];
  risks: string[];
  terms: string[];
  agreements: string[];
  mustRead: string[];
  departments: string[];
  severity: SignalSeverity;
}

const REVIEW_SYSTEM_PROMPT = `You are reviewing a project document for a management reporting tool. Read the text and pull out concrete points under each category below. Only include a point if it is actually stated or clearly implied in the text -- never invent one. Leave a category as an empty array if nothing relevant is present.

Return ONLY JSON in this exact shape:
{"compliance": string[], "security": string[], "timelines": string[], "risks": string[], "terms": string[], "agreements": string[], "mustRead": string[], "departments": string[], "severity": "minor"|"moderate"|"major"}

Category guide:
- compliance: regulatory, legal, or policy obligations mentioned
- security: security requirements, findings, or exposures mentioned
- timelines: deadlines, termination notices, renewal dates, key dates
- risks: anything that threatens delivery, cost, or continuity
- terms: guarantee/warranty periods, SLAs, service terms
- agreements: contractual commitments or obligations between the parties
- mustRead: the handful of points a Project Manager absolutely needs to read, drawn from the categories above (plain sentences, not category names) -- empty array if nothing rises to that bar
- departments: which internal departments should review this (e.g. "Legal", "Security", "Finance", "Engineering") -- only ones actually relevant, never a generic full list
- severity: "major" if leadership needs to know now, "moderate" if it needs attention this week, "minor" if just worth noting

If the document has nothing relevant to any category, return every array empty and severity "minor".`;

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function reviewDocumentText(text: string): Promise<DocumentReviewResult> {
  const raw = (await completeJson([
    { role: "system", content: REVIEW_SYSTEM_PROMPT },
    { role: "user", content: text },
  ])) as Record<string, unknown>;

  const severity: SignalSeverity = (["minor", "moderate", "major"] as const).includes(raw.severity as SignalSeverity)
    ? (raw.severity as SignalSeverity)
    : "minor";

  return {
    compliance: toStringArray(raw.compliance),
    security: toStringArray(raw.security),
    timelines: toStringArray(raw.timelines),
    risks: toStringArray(raw.risks),
    terms: toStringArray(raw.terms),
    agreements: toStringArray(raw.agreements),
    mustRead: toStringArray(raw.mustRead),
    departments: toStringArray(raw.departments),
    severity,
  };
}

// AI-based -- reads a newly uploaded document (or a new project's charter,
// since ingestDocument backs both) across several categories at once, saves
// the full breakdown for the Dashboard, and still raises a Signal so the
// existing feed/escalation path keeps working unchanged.
export async function reviewDocument(projectId: string, docId: string, text: string) {
  try {
    const review = await reviewDocumentText(text);
    const supabase = getSupabase();

    const { error } = await supabase.from("document_reviews").insert({
      narrative_doc_id: docId,
      project_id: projectId,
      compliance: review.compliance,
      security: review.security,
      timelines: review.timelines,
      risks: review.risks,
      terms: review.terms,
      agreements: review.agreements,
      must_read: review.mustRead,
      departments: review.departments,
      severity: review.severity,
    });
    if (error) console.error("[sentinel] failed to record document review:", error.message);

    const categoryCounts = [
      review.compliance,
      review.security,
      review.timelines,
      review.risks,
      review.terms,
      review.agreements,
    ];
    const totalPoints = categoryCounts.reduce((sum, c) => sum + c.length, 0);

    if (totalPoints > 0) {
      const nonEmptyCategoryCount = categoryCounts.filter((c) => c.length > 0).length;
      const summary =
        review.mustRead[0] ??
        `Document reviewed — ${totalPoints} point(s) found across ${nonEmptyCategoryCount} area(s)`;
      await recordSignal(projectId, "document", docId, review.severity, summary);
    }
  } catch (err) {
    console.error("[sentinel] document review failed:", err);
  }
}

export async function listRecentDocumentReviews(limit = 10): Promise<DocumentReviewWithMeta[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("document_reviews")
    .select("*, projects(name), narrative_docs(title, confidential)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list document reviews: ${error.message}`);

  return (data ?? []).map((row) => {
    const joined = row as unknown as {
      projects: { name: string } | null;
      narrative_docs: { title: string; confidential: boolean } | null;
    };
    return {
      id: row.id,
      narrativeDocId: row.narrative_doc_id,
      docTitle: joined.narrative_docs?.title ?? row.narrative_doc_id,
      projectId: row.project_id,
      projectName: joined.projects?.name ?? row.project_id,
      confidential: joined.narrative_docs?.confidential ?? false,
      compliance: row.compliance,
      security: row.security,
      timelines: row.timelines,
      risks: row.risks,
      terms: row.terms,
      agreements: row.agreements,
      mustRead: row.must_read,
      departments: row.departments,
      severity: row.severity,
      createdAt: row.created_at,
    };
  });
}
