import type {
  Dataset,
  Project,
  Milestone,
  SecurityFinding,
  Incident,
  Engineer,
  Allocation,
} from "./types";

export type RiskLevel = "low" | "medium" | "high";

export interface ProjectRisk {
  projectId: string;
  score: number; // 0-100, higher = riskier
  level: RiskLevel;
  factors: string[];
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export function computeProjectRisk(
  project: Project,
  milestones: Milestone[],
  securityFindings: SecurityFinding[],
  incidents: Incident[]
): ProjectRisk {
  let score = 0;
  const factors: string[] = [];

  if (project.status === "off-track") {
    score += 35;
    factors.push("Project self-reported status is off-track");
  } else if (project.status === "at-risk") {
    score += 18;
    factors.push("Project self-reported status is at-risk");
  }

  const variancePct = budgetVariancePct(project);
  if (variancePct >= 25) {
    score += 20;
    factors.push(`Budget is ${variancePct.toFixed(0)}% over plan`);
  } else if (variancePct >= 10) {
    score += 10;
    factors.push(`Budget is ${variancePct.toFixed(0)}% over plan`);
  }

  const slippedMilestones = milestones.filter((m) => m.status !== "on-track").length;
  if (slippedMilestones > 0) {
    const add = Math.min(20, slippedMilestones * 8);
    score += add;
    factors.push(`${slippedMilestones} milestone(s) at risk or off-track`);
  }

  const openCritical = securityFindings.filter((f) => !f.resolved && (f.severity === "critical" || f.severity === "high")).length;
  if (openCritical > 0) {
    const add = Math.min(15, openCritical * 4);
    score += add;
    factors.push(`${openCritical} unresolved critical/high security finding(s)`);
  }

  const sev1Count = incidents.filter((i) => i.severity === "sev1").length;
  const sev2Count = incidents.filter((i) => i.severity === "sev2").length;
  if (sev1Count > 0) {
    score += Math.min(15, sev1Count * 10);
    factors.push(`${sev1Count} sev1 incident(s) this quarter`);
  } else if (sev2Count > 0) {
    score += Math.min(8, sev2Count * 4);
    factors.push(`${sev2Count} sev2 incident(s) this quarter`);
  }

  score = Math.min(100, Math.round(score));

  return { projectId: project.id, score, level: levelFromScore(score), factors };
}

export function budgetVariancePct(project: Project): number {
  return ((project.budgetSpent - project.budgetPlanned) / project.budgetPlanned) * 100;
}

export interface MilestoneRollup {
  onTrack: number;
  atRisk: number;
  offTrack: number;
  total: number;
}

export function computeMilestoneRollup(milestones: Milestone[]): MilestoneRollup {
  const onTrack = milestones.filter((m) => m.status === "on-track").length;
  const atRisk = milestones.filter((m) => m.status === "at-risk").length;
  const offTrack = milestones.filter((m) => m.status === "off-track").length;
  return { onTrack, atRisk, offTrack, total: milestones.length };
}

export type CapacityStatus = "overloaded" | "balanced" | "underloaded";

export interface EngineerCapacity {
  engineerId: string;
  name: string;
  teamId: string;
  weeklyCapacityHours: number;
  avgAllocatedHours: number;
  utilizationPct: number;
  status: CapacityStatus;
}

export function computeEngineerCapacity(engineer: Engineer, allocations: Allocation[]): EngineerCapacity {
  const relevant = allocations.filter((a) => a.engineerId === engineer.id);
  const avgAllocatedHours = relevant.length
    ? relevant.reduce((sum, a) => sum + a.allocatedHours, 0) / relevant.length
    : 0;
  const utilizationPct = engineer.weeklyCapacityHours > 0
    ? (avgAllocatedHours / engineer.weeklyCapacityHours) * 100
    : 0;

  const status: CapacityStatus = utilizationPct >= 110 ? "overloaded" : utilizationPct <= 75 ? "underloaded" : "balanced";

  return {
    engineerId: engineer.id,
    name: engineer.name,
    teamId: engineer.teamId,
    weeklyCapacityHours: engineer.weeklyCapacityHours,
    avgAllocatedHours: Math.round(avgAllocatedHours),
    utilizationPct: Math.round(utilizationPct),
    status,
  };
}

export interface OrgSummary {
  projectCounts: { onTrack: number; atRisk: number; offTrack: number; total: number };
  budgetPlannedTotal: number;
  budgetSpentTotal: number;
  budgetVariancePct: number;
  openCriticalHighFindings: number;
  sev1IncidentsCount: number;
  overloadedEngineerCount: number;
  underloadedEngineerCount: number;
  projectRisks: ProjectRisk[];
}

export function computeOrgSummary(dataset: Dataset): OrgSummary {
  const projectCounts = {
    onTrack: dataset.projects.filter((p) => p.status === "on-track").length,
    atRisk: dataset.projects.filter((p) => p.status === "at-risk").length,
    offTrack: dataset.projects.filter((p) => p.status === "off-track").length,
    total: dataset.projects.length,
  };

  const budgetPlannedTotal = dataset.projects.reduce((sum, p) => sum + p.budgetPlanned, 0);
  const budgetSpentTotal = dataset.projects.reduce((sum, p) => sum + p.budgetSpent, 0);
  const budgetVariancePctTotal = budgetPlannedTotal
    ? ((budgetSpentTotal - budgetPlannedTotal) / budgetPlannedTotal) * 100
    : 0;

  const openCriticalHighFindings = dataset.securityFindings.filter(
    (f) => !f.resolved && (f.severity === "critical" || f.severity === "high")
  ).length;

  const sev1IncidentsCount = dataset.incidents.filter((i) => i.severity === "sev1").length;

  const capacities = dataset.engineers.map((e) => computeEngineerCapacity(e, dataset.allocations));
  const overloadedEngineerCount = capacities.filter((c) => c.status === "overloaded").length;
  const underloadedEngineerCount = capacities.filter((c) => c.status === "underloaded").length;

  const projectRisks = dataset.projects
    .map((p) =>
      computeProjectRisk(
        p,
        dataset.milestones.filter((m) => m.projectId === p.id),
        dataset.securityFindings.filter((f) => f.projectId === p.id),
        dataset.incidents.filter((i) => i.projectId === p.id)
      )
    )
    .sort((a, b) => b.score - a.score);

  return {
    projectCounts,
    budgetPlannedTotal,
    budgetSpentTotal,
    budgetVariancePct: budgetVariancePctTotal,
    openCriticalHighFindings,
    sev1IncidentsCount,
    overloadedEngineerCount,
    underloadedEngineerCount,
    projectRisks,
  };
}
