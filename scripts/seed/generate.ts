import { createRng } from "../../src/lib/rng";
import type {
  Team,
  Engineer,
  Project,
  Ticket,
  Milestone,
  SecurityFinding,
  Incident,
  Allocation,
  NarrativeDoc,
  Dataset,
  ProjectStatus,
} from "../../src/lib/types";

const SEED = 42;

const TEAM_DEFS: { name: string; focusArea: string }[] = [
  { name: "Platform", focusArea: "Internal infrastructure and developer tooling" },
  { name: "Payments", focusArea: "Payment processing and fraud prevention" },
  { name: "Growth", focusArea: "Onboarding, activation, and referrals" },
];

const PROJECT_DEFS: {
  name: string;
  team: string;
  status: ProjectStatus;
  budgetPlanned: number;
  budgetVariancePct: number;
  durationDays: number;
}[] = [
  { name: "Atlas", team: "Platform", status: "on-track", budgetPlanned: 180000, budgetVariancePct: 0.04, durationDays: 120 },
  { name: "Nimbus", team: "Platform", status: "at-risk", budgetPlanned: 140000, budgetVariancePct: 0.18, durationDays: 100 },
  { name: "Phoenix", team: "Payments", status: "off-track", budgetPlanned: 320000, budgetVariancePct: 0.34, durationDays: 150 },
  { name: "Orbit", team: "Payments", status: "on-track", budgetPlanned: 210000, budgetVariancePct: 0.06, durationDays: 110 },
  { name: "Comet", team: "Growth", status: "at-risk", budgetPlanned: 95000, budgetVariancePct: 0.22, durationDays: 90 },
  { name: "Lumen", team: "Growth", status: "on-track", budgetPlanned: 130000, budgetVariancePct: 0.02, durationDays: 100 },
];

const FIRST_NAMES = [
  "Maria", "James", "Aisha", "Noah", "Yuki", "Diego", "Priya", "Liam",
  "Fatima", "Ethan", "Sofia", "Wei", "Omar", "Elena", "Kwame", "Ava",
  "Ravi", "Grace", "Lucas", "Ingrid",
];
const LAST_NAMES = [
  "Nguyen", "Kowalski", "Osei", "Silva", "Tanaka", "Rossi", "Patel", "Becker",
  "Haddad", "Moreau", "Kim", "Volkov", "Sato", "Alvarez", "Meier", "Chowdhury",
];

const ROLES = ["Software Engineer", "Senior Engineer", "Staff Engineer", "QA Engineer", "Tech Lead"];

const TICKET_TITLES = [
  "Fix null pointer on checkout retry",
  "Add rate limiting to public API",
  "Migrate service to new queue",
  "Reduce cold start latency",
  "Add integration tests for webhook handler",
  "Refactor auth middleware",
  "Update dependency to patch CVE",
  "Improve error messaging on failed payments",
  "Add caching layer for lookup service",
  "Fix flaky test in CI pipeline",
  "Implement feature flag rollout",
  "Address memory leak in worker process",
  "Add monitoring dashboard for latency",
  "Backfill historical data for reporting",
  "Fix race condition in retry logic",
  "Improve onboarding wizard copy",
  "Add pagination to admin panel",
  "Harden input validation on upload endpoint",
  "Reduce bundle size for landing page",
  "Fix timezone bug in scheduling",
];

const VULN_PACKAGES = [
  "legacy-payment-gateway-sdk", "xml-parser-lite", "auth-token-lib",
  "image-resize-utils", "old-crypto-shim", "webhook-signature-verify",
];

function makeId(prefix: string, i: number) {
  return `${prefix}_${String(i).padStart(4, "0")}`;
}

export function generateDataset(): Dataset {
  const rng = createRng(SEED);

  // Teams
  const teams: Team[] = TEAM_DEFS.map((t, i) => ({
    id: makeId("team", i + 1),
    name: t.name,
    focusArea: t.focusArea,
  }));
  const teamByName = new Map(teams.map((t) => [t.name, t]));

  // Engineers (4-6 per team)
  const engineers: Engineer[] = [];
  let engIdx = 1;
  for (const team of teams) {
    const count = rng.int(4, 6);
    for (let i = 0; i < count; i++) {
      engineers.push({
        id: makeId("eng", engIdx),
        name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
        teamId: team.id,
        role: rng.pick(ROLES),
        weeklyCapacityHours: rng.pick([32, 36, 40, 40, 40]),
      });
      engIdx++;
    }
  }

  // Projects
  const projects: Project[] = PROJECT_DEFS.map((p, i) => {
    const team = teamByName.get(p.team)!;
    const start = rng.daysAgo(p.durationDays);
    const target = new Date(start);
    target.setDate(target.getDate() + p.durationDays + rng.int(-10, 20));
    const budgetSpent = Math.round(p.budgetPlanned * (1 + p.budgetVariancePct));
    return {
      id: makeId("proj", i + 1),
      name: p.name,
      teamId: team.id,
      status: p.status,
      startDate: start.toISOString().slice(0, 10),
      targetDate: target.toISOString().slice(0, 10),
      budgetPlanned: p.budgetPlanned,
      budgetSpent,
    };
  });
  const projectByName = new Map(projects.map((p) => [p.name, p]));
  const engineersByTeam = new Map(teams.map((t) => [t.id, engineers.filter((e) => e.teamId === t.id)]));

  // Tickets
  const tickets: Ticket[] = [];
  let ticketIdx = 1;
  for (const project of projects) {
    const teamEngineers = engineersByTeam.get(project.teamId)!;
    const ticketCount = rng.int(30, 55);
    const statusWeights: [Ticket["status"], number][] =
      project.status === "off-track"
        ? [["done", 30], ["in-progress", 25], ["blocked", 25], ["todo", 20]]
        : project.status === "at-risk"
        ? [["done", 45], ["in-progress", 25], ["blocked", 12], ["todo", 18]]
        : [["done", 65], ["in-progress", 20], ["blocked", 5], ["todo", 10]];

    for (let i = 0; i < ticketCount; i++) {
      const sprint = rng.int(1, 8);
      const createdAt = rng.dateBetween(new Date(project.startDate), new Date());
      const updatedAt = rng.dateBetween(createdAt, new Date());
      tickets.push({
        id: makeId("tix", ticketIdx),
        projectId: project.id,
        assigneeId: rng.pick(teamEngineers).id,
        title: rng.pick(TICKET_TITLES),
        status: rng.pickWeighted(statusWeights),
        storyPoints: rng.pick([1, 2, 3, 5, 8]),
        sprint,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
      ticketIdx++;
    }
  }

  // Milestones
  const milestones: Milestone[] = [];
  let msIdx = 1;
  const MILESTONE_NAMES = ["Design review", "Alpha rollout", "Beta rollout", "GA launch", "Migration cutover"];
  for (const project of projects) {
    const count = rng.int(2, 4);
    const names = [...MILESTONE_NAMES];
    for (let i = 0; i < count; i++) {
      const name = rng.pick(names);
      const due = rng.dateBetween(new Date(project.startDate), new Date(project.targetDate));
      const status: ProjectStatus =
        project.status === "off-track" ? rng.pickWeighted([["off-track", 40], ["at-risk", 40], ["on-track", 20]])
        : project.status === "at-risk" ? rng.pickWeighted([["at-risk", 50], ["on-track", 40], ["off-track", 10]])
        : rng.pickWeighted([["on-track", 80], ["at-risk", 20]]);
      milestones.push({
        id: makeId("ms", msIdx),
        projectId: project.id,
        name,
        dueDate: due.toISOString().slice(0, 10),
        status,
      });
      msIdx++;
    }
  }

  // Security findings (Phoenix gets the worst of it — legacy payment SDK)
  const securityFindings: SecurityFinding[] = [];
  let secIdx = 1;
  for (const project of projects) {
    const baseCount = project.name === "Phoenix" ? rng.int(6, 9) : rng.int(1, 4);
    for (let i = 0; i < baseCount; i++) {
      const severity = project.name === "Phoenix"
        ? rng.pickWeighted<SecurityFinding["severity"]>([["critical", 30], ["high", 40], ["medium", 20], ["low", 10]])
        : rng.pickWeighted<SecurityFinding["severity"]>([["critical", 5], ["high", 20], ["medium", 40], ["low", 35]]);
      const discoveredAt = rng.dateBetween(new Date(project.startDate), new Date());
      securityFindings.push({
        id: makeId("vuln", secIdx),
        projectId: project.id,
        severity,
        packageName: project.name === "Phoenix" && i === 0 ? "legacy-payment-gateway-sdk" : rng.pick(VULN_PACKAGES),
        description: `Known vulnerability flagged by dependency scan in ${project.name === "Phoenix" && i === 0 ? "legacy-payment-gateway-sdk" : rng.pick(VULN_PACKAGES)}, requires upgrade or patch.`,
        discoveredAt: discoveredAt.toISOString(),
        resolved: rng.bool(project.status === "off-track" ? 0.3 : 0.6),
      });
      secIdx++;
    }
  }

  // Incidents (Phoenix gets a headline sev1)
  const incidents: Incident[] = [];
  let incIdx = 1;
  for (const project of projects) {
    const count = project.status === "off-track" ? rng.int(3, 5) : project.status === "at-risk" ? rng.int(1, 3) : rng.int(0, 2);
    for (let i = 0; i < count; i++) {
      const severity: Incident["severity"] =
        project.name === "Phoenix" && i === 0
          ? "sev1"
          : rng.pickWeighted([["sev1", 10], ["sev2", 30], ["sev3", 60]]);
      const startedAt = rng.dateBetween(new Date(project.startDate), new Date());
      const mttr = severity === "sev1" ? rng.int(90, 240) : severity === "sev2" ? rng.int(30, 120) : rng.int(10, 60);
      const resolvedAt = new Date(startedAt.getTime() + mttr * 60000);
      const rootCause =
        project.name === "Phoenix" && i === 0
          ? "Legacy payment gateway SDK timed out under peak load, causing checkout failures for ~12% of transactions until failover was manually triggered."
          : rng.pick([
              "Deploy introduced a regression in the retry logic, causing elevated error rates.",
              "Upstream dependency outage cascaded into degraded response times.",
              "Misconfigured feature flag exposed an unfinished code path in production.",
              "Database connection pool exhaustion under unexpected traffic spike.",
            ]);
      incidents.push({
        id: makeId("inc", incIdx),
        projectId: project.id,
        severity,
        title: severity === "sev1" ? `Checkout outage — ${project.name}` : `${severity.toUpperCase()} incident — ${project.name}`,
        startedAt: startedAt.toISOString(),
        resolvedAt: resolvedAt.toISOString(),
        mttrMinutes: mttr,
        rootCauseSummary: rootCause,
      });
      incIdx++;
    }
  }

  // Allocations (last 8 weeks per engineer). Each engineer gets a persistent
  // capacity profile so the average over 8 weeks actually shows a clear signal,
  // instead of random weekly noise averaging back out to ~100%.
  const allocations: Allocation[] = [];
  for (const eng of engineers) {
    const profile = rng.pickWeighted<"overloaded" | "underloaded" | "balanced">([
      ["overloaded", 20],
      ["underloaded", 15],
      ["balanced", 65],
    ]);
    for (let w = 0; w < 8; w++) {
      const weekStart = rng.daysAgo(w * 7);
      const allocatedHours =
        profile === "overloaded"
          ? Math.round((eng.weeklyCapacityHours * rng.int(112, 145)) / 100)
          : profile === "underloaded"
          ? Math.round((eng.weeklyCapacityHours * rng.int(40, 72)) / 100)
          : Math.round((eng.weeklyCapacityHours * rng.int(85, 105)) / 100);
      allocations.push({
        engineerId: eng.id,
        weekStart: weekStart.toISOString().slice(0, 10),
        allocatedHours,
      });
    }
  }

  // Narrative docs — the RAG corpus
  const narrativeDocs: NarrativeDoc[] = [];
  let docIdx = 1;

  function addDoc(project: Project, type: NarrativeDoc["type"], title: string, content: string, daysAgoOffset: number) {
    narrativeDocs.push({
      id: makeId("doc", docIdx),
      projectId: project.id,
      type,
      title,
      content,
      createdAt: rng.daysAgo(daysAgoOffset).toISOString(),
    });
    docIdx++;
  }

  for (const project of projects) {
    const variancePct = Math.round(((project.budgetSpent - project.budgetPlanned) / project.budgetPlanned) * 100);
    const projectIncidents = incidents.filter((i) => i.projectId === project.id);
    const projectMilestones = milestones.filter((m) => m.projectId === project.id);
    const lateMilestones = projectMilestones.filter((m) => m.status !== "on-track");
    const projectVulns = securityFindings.filter((v) => v.projectId === project.id && !v.resolved);
    const criticalVulns = projectVulns.filter((v) => v.severity === "critical" || v.severity === "high");

    // Sprint retro
    addDoc(
      project,
      "retro",
      `${project.name} — Sprint Retro`,
      `Team velocity this sprint was ${project.status === "off-track" ? "well below" : project.status === "at-risk" ? "slightly below" : "in line with"} plan. ` +
        `${project.status === "off-track" ? `Several tickets carried over from the previous sprint due to blocked dependencies, and the team flagged concerns about scope creep on the ${project.name} rollout. ` : ""}` +
        `${lateMilestones.length > 0 ? `The "${lateMilestones[0].name}" milestone is currently marked ${lateMilestones[0].status}, and the team does not expect to recover the slip without re-scoping. ` : "Milestones remain on track and the team is confident in the current plan. "}` +
        `${criticalVulns.length > 0 ? `Engineers also raised that ${criticalVulns.length} unresolved high/critical security findings (including issues in ${criticalVulns[0].packageName}) need to be prioritized before the next release. ` : ""}` +
        `Budget is tracking at ${variancePct >= 0 ? `${variancePct}% over` : `${Math.abs(variancePct)}% under`} the original plan.`,
      rng.int(5, 20)
    );

    // Status update
    addDoc(
      project,
      "status-update",
      `${project.name} — Status Update`,
      `Overall project status: ${project.status}. ` +
        `Spend to date is $${project.budgetSpent.toLocaleString()} against a planned budget of $${project.budgetPlanned.toLocaleString()} (${variancePct >= 0 ? "+" : ""}${variancePct}%). ` +
        `${projectIncidents.length > 0 ? `There have been ${projectIncidents.length} production incident(s) this quarter, including ${projectIncidents.filter((i) => i.severity === "sev1").length} sev1. ` : "No production incidents have been reported this quarter. "}` +
        `${project.status !== "on-track" ? `Key risk: ${lateMilestones.length > 0 ? `the "${lateMilestones[0].name}" milestone is at risk of missing its due date of ${lateMilestones[0].dueDate}.` : "cumulative schedule slip across multiple workstreams."} Recommend leadership review before the next planning cycle.` : "No escalations needed at this time."}`,
      rng.int(1, 10)
    );

    // Postmortem for the worst incident, if any
    const sev1 = projectIncidents.find((i) => i.severity === "sev1");
    const worstIncident = sev1 ?? projectIncidents[0];
    if (worstIncident) {
      addDoc(
        project,
        "postmortem",
        `${project.name} — Postmortem: ${worstIncident.title}`,
        `Summary: ${worstIncident.rootCauseSummary} ` +
          `Time to resolution was ${worstIncident.mttrMinutes} minutes. ` +
          `Impact: users on the ${project.name} service experienced degraded or failed requests during the incident window. ` +
          `Remediation: the team has added additional monitoring and a follow-up ticket to remove the dependency on the affected component. ` +
          `${project.name === "Phoenix" ? "This is the second incident this quarter tied to the legacy payment gateway SDK; the team recommends prioritizing the SDK migration in the next planning cycle to prevent recurrence." : "No recurrence has been observed since the fix was deployed."}`,
        rng.int(2, 25)
      );
    }
  }

  return { teams, engineers, projects, tickets, milestones, securityFindings, incidents, allocations, narrativeDocs };
}

async function main() {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dataset = generateDataset();
  const outDir = path.resolve(__dirname, "output");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "dataset.json");
  await fs.writeFile(outPath, JSON.stringify(dataset, null, 2));
  console.log(`Generated dataset -> ${outPath}`);
  console.log(
    `teams=${dataset.teams.length} engineers=${dataset.engineers.length} projects=${dataset.projects.length} ` +
      `tickets=${dataset.tickets.length} milestones=${dataset.milestones.length} ` +
      `securityFindings=${dataset.securityFindings.length} incidents=${dataset.incidents.length} ` +
      `allocations=${dataset.allocations.length} narrativeDocs=${dataset.narrativeDocs.length}`
  );
}

if (require.main === module) {
  main();
}
