import { NextResponse } from "next/server";
import { getDataset } from "@/lib/data-access";
import { computeOrgSummary, computeEngineerCapacity, computeMilestoneRollup } from "@/lib/analytics";

export async function GET() {
  try {
    const dataset = await getDataset();
    const summary = computeOrgSummary(dataset);
    const capacities = dataset.engineers.map((e) => computeEngineerCapacity(e, dataset.allocations));
    const milestoneRollup = computeMilestoneRollup(dataset.milestones);

    const projects = dataset.projects.map((p) => {
      const risk = summary.projectRisks.find((r) => r.projectId === p.id)!;
      const team = dataset.teams.find((t) => t.id === p.teamId);
      return { ...p, teamName: team?.name ?? p.teamId, risk };
    });

    return NextResponse.json({
      summary,
      projects,
      capacities,
      milestoneRollup,
      teams: dataset.teams,
    });
  } catch (err) {
    console.error("[/api/dashboard] failed:", err);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
