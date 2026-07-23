import { config } from "dotenv";
config({ path: ".env.local" });
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getSupabase } from "../../src/lib/supabase-admin";
import type { Dataset } from "../../src/lib/types";
import type { Database } from "../../src/lib/database.types";

const BATCH_SIZE = 500;

type TableName = keyof Database["public"]["Tables"];

async function insertBatched<T extends TableName>(table: T, rows: Database["public"]["Tables"][T]["Insert"][]) {
  const supabase = getSupabase();
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    // TS can't verify Insert-per-table when T is generic inside this function body,
    // even though every call site below is fully typed. Narrow, contained cast.
    const { error } = await supabase.from(table).insert(batch as never[]);
    if (error) {
      throw new Error(`Insert into ${table} failed: ${error.message}`);
    }
  }
  console.log(`Loaded ${rows.length} rows into ${table}`);
}

async function main() {
  const dataPath = path.resolve(__dirname, "output", "dataset.json");
  const raw = await fs.readFile(dataPath, "utf-8");
  const dataset: Dataset = JSON.parse(raw);

  await insertBatched(
    "teams",
    dataset.teams.map((t) => ({ id: t.id, name: t.name, focus_area: t.focusArea }))
  );

  await insertBatched(
    "engineers",
    dataset.engineers.map((e) => ({
      id: e.id,
      name: e.name,
      team_id: e.teamId,
      role: e.role,
      weekly_capacity_hours: e.weeklyCapacityHours,
    }))
  );

  await insertBatched(
    "projects",
    dataset.projects.map((p) => ({
      id: p.id,
      name: p.name,
      team_id: p.teamId,
      status: p.status,
      start_date: p.startDate,
      target_date: p.targetDate,
      budget_planned: p.budgetPlanned,
      budget_spent: p.budgetSpent,
    }))
  );

  await insertBatched(
    "tickets",
    dataset.tickets.map((t) => ({
      id: t.id,
      project_id: t.projectId,
      assignee_id: t.assigneeId,
      title: t.title,
      status: t.status,
      story_points: t.storyPoints,
      sprint: t.sprint,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    }))
  );

  await insertBatched(
    "milestones",
    dataset.milestones.map((m) => ({
      id: m.id,
      project_id: m.projectId,
      name: m.name,
      due_date: m.dueDate,
      status: m.status,
    }))
  );

  await insertBatched(
    "security_findings",
    dataset.securityFindings.map((s) => ({
      id: s.id,
      project_id: s.projectId,
      severity: s.severity,
      package_name: s.packageName,
      description: s.description,
      discovered_at: s.discoveredAt,
      resolved: s.resolved,
    }))
  );

  await insertBatched(
    "incidents",
    dataset.incidents.map((i) => ({
      id: i.id,
      project_id: i.projectId,
      severity: i.severity,
      title: i.title,
      started_at: i.startedAt,
      resolved_at: i.resolvedAt,
      mttr_minutes: i.mttrMinutes,
      root_cause_summary: i.rootCauseSummary,
    }))
  );

  await insertBatched(
    "allocations",
    dataset.allocations.map((a) => ({
      engineer_id: a.engineerId,
      week_start: a.weekStart,
      allocated_hours: a.allocatedHours,
    }))
  );

  await insertBatched(
    "narrative_docs",
    dataset.narrativeDocs.map((d) => ({
      id: d.id,
      project_id: d.projectId,
      type: d.type,
      title: d.title,
      content: d.content,
      created_at: d.createdAt,
    }))
  );

  console.log("Done. Narrative docs are loaded but not yet embedded — run generate:embeddings next.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
