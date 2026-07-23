import { getSupabase } from "./supabase";
import type {
  Dataset,
  Team,
  Engineer,
  Project,
  Ticket,
  Milestone,
  SecurityFinding,
  Incident,
  Allocation,
  NarrativeDoc,
} from "./types";

// Maps the snake_case Supabase rows back to the camelCase shapes used across the app,
// so analytics.ts and the RAG layer can share one set of types regardless of source.
export async function getDataset(): Promise<Dataset> {
  const supabase = getSupabase();

  const [teamsRes, engineersRes, projectsRes, ticketsRes, milestonesRes, findingsRes, incidentsRes, allocationsRes, docsRes] =
    await Promise.all([
      supabase.from("teams").select("*"),
      supabase.from("engineers").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("tickets").select("*"),
      supabase.from("milestones").select("*"),
      supabase.from("security_findings").select("*"),
      supabase.from("incidents").select("*"),
      supabase.from("allocations").select("*"),
      supabase.from("narrative_docs").select("*"),
    ]);

  for (const [name, res] of Object.entries({
    teams: teamsRes,
    engineers: engineersRes,
    projects: projectsRes,
    tickets: ticketsRes,
    milestones: milestonesRes,
    securityFindings: findingsRes,
    incidents: incidentsRes,
    allocations: allocationsRes,
    narrativeDocs: docsRes,
  })) {
    if (res.error) throw new Error(`Failed to load ${name}: ${res.error.message}`);
  }

  const teams: Team[] = (teamsRes.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    focusArea: t.focus_area,
  }));

  const engineers: Engineer[] = (engineersRes.data ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    teamId: e.team_id,
    role: e.role,
    weeklyCapacityHours: e.weekly_capacity_hours,
  }));

  const projects: Project[] = (projectsRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    teamId: p.team_id,
    status: p.status,
    startDate: p.start_date,
    targetDate: p.target_date,
    budgetPlanned: Number(p.budget_planned),
    budgetSpent: Number(p.budget_spent),
  }));

  const tickets: Ticket[] = (ticketsRes.data ?? []).map((t) => ({
    id: t.id,
    projectId: t.project_id,
    assigneeId: t.assignee_id,
    title: t.title,
    status: t.status,
    storyPoints: t.story_points,
    sprint: t.sprint,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  const milestones: Milestone[] = (milestonesRes.data ?? []).map((m) => ({
    id: m.id,
    projectId: m.project_id,
    name: m.name,
    dueDate: m.due_date,
    status: m.status,
  }));

  const securityFindings: SecurityFinding[] = (findingsRes.data ?? []).map((f) => ({
    id: f.id,
    projectId: f.project_id,
    severity: f.severity,
    packageName: f.package_name,
    description: f.description,
    discoveredAt: f.discovered_at,
    resolved: f.resolved,
  }));

  const incidents: Incident[] = (incidentsRes.data ?? []).map((i) => ({
    id: i.id,
    projectId: i.project_id,
    severity: i.severity,
    title: i.title,
    startedAt: i.started_at,
    resolvedAt: i.resolved_at,
    mttrMinutes: i.mttr_minutes,
    rootCauseSummary: i.root_cause_summary,
  }));

  const allocations: Allocation[] = (allocationsRes.data ?? []).map((a) => ({
    engineerId: a.engineer_id,
    weekStart: a.week_start,
    allocatedHours: a.allocated_hours,
  }));

  const narrativeDocs: NarrativeDoc[] = (docsRes.data ?? []).map((d) => ({
    id: d.id,
    projectId: d.project_id,
    type: d.type,
    title: d.title,
    content: d.content,
    createdAt: d.created_at,
  }));

  return { teams, engineers, projects, tickets, milestones, securityFindings, incidents, allocations, narrativeDocs };
}
