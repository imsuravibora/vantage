import { getSupabase } from "./supabase-admin";
import { completeJson } from "./groq";
import type { SignalSource, SignalSeverity } from "./types";

interface SignalCheckResult {
  hasSignal: boolean;
  severity: SignalSeverity;
  summary: string;
}

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

const SIGNAL_SYSTEM_PROMPT = `You scan project text for risk signals a rules-based system would miss -- blockers, threats, morale issues, vague ownership, anything concerning that isn't just a budget/schedule/incident number someone would already track. Return ONLY JSON: {"hasSignal": boolean, "severity": "minor"|"moderate"|"major", "summary": string}. If nothing concerning, hasSignal is false and summary is "". Severity guide: minor = worth noting but not urgent, moderate = needs attention this week, major = needs leadership attention now. Never invent a risk that isn't actually stated or clearly implied in the text.`;

export async function checkTextForSignal(text: string): Promise<SignalCheckResult> {
  const raw = (await completeJson([
    { role: "system", content: SIGNAL_SYSTEM_PROMPT },
    { role: "user", content: text },
  ])) as Record<string, unknown>;

  const hasSignal = raw.hasSignal === true;
  const severity: SignalSeverity = (["minor", "moderate", "major"] as const).includes(raw.severity as SignalSeverity)
    ? (raw.severity as SignalSeverity)
    : "minor";
  const summary = typeof raw.summary === "string" ? raw.summary : "";

  return { hasSignal, severity, summary };
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

// AI-based -- for unstructured text (documents, extracted project charters)
// where a real risk signal might be worded in ways no fixed rule would catch.
export async function scanTextForRisk(projectId: string, source: SignalSource, sourceId: string, text: string) {
  try {
    const result = await checkTextForSignal(text);
    if (result.hasSignal) {
      await recordSignal(projectId, source, sourceId, result.severity, result.summary);
    }
  } catch (err) {
    console.error("[sentinel] scan failed:", err);
  }
}
