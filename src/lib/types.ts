export type ProjectStatus = "on-track" | "at-risk" | "off-track";
export type TicketStatus = "todo" | "in-progress" | "done" | "blocked";
export type FindingSeverity = "critical" | "high" | "medium" | "low";
export type IncidentSeverity = "sev1" | "sev2" | "sev3";
export type DocType = "retro" | "postmortem" | "status-update";
export type ReportStatus = "pending-review" | "approved" | "rejected";

export interface Team {
  id: string;
  name: string;
  focusArea: string;
}

export interface Engineer {
  id: string;
  name: string;
  teamId: string;
  role: string;
  weeklyCapacityHours: number;
}

export interface Project {
  id: string;
  name: string;
  teamId: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
  budgetPlanned: number;
  budgetSpent: number;
}

export interface Ticket {
  id: string;
  projectId: string;
  assigneeId: string;
  title: string;
  status: TicketStatus;
  storyPoints: number;
  sprint: number;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  status: ProjectStatus;
}

export interface SecurityFinding {
  id: string;
  projectId: string;
  severity: FindingSeverity;
  packageName: string;
  description: string;
  discoveredAt: string;
  resolved: boolean;
}

export interface Incident {
  id: string;
  projectId: string;
  severity: IncidentSeverity;
  title: string;
  startedAt: string;
  resolvedAt: string;
  mttrMinutes: number;
  rootCauseSummary: string;
}

export interface Allocation {
  engineerId: string;
  weekStart: string;
  allocatedHours: number;
}

export interface NarrativeDoc {
  id: string;
  projectId: string;
  type: DocType;
  title: string;
  content: string;
  createdAt: string;
}

export interface Dataset {
  teams: Team[];
  engineers: Engineer[];
  projects: Project[];
  tickets: Ticket[];
  milestones: Milestone[];
  securityFindings: SecurityFinding[];
  incidents: Incident[];
  allocations: Allocation[];
  narrativeDocs: NarrativeDoc[];
}
