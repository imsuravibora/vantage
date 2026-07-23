import { completeJson } from "./groq";
import type { ProjectStatus } from "./types";

export interface ExtractedProject {
  name: string;
  status: ProjectStatus;
  budgetPlanned: number;
  startDate: string;
  targetDate: string;
  milestones: { name: string; dueDate: string }[];
}

const VALID_STATUSES: ProjectStatus[] = ["on-track", "at-risk", "off-track"];

const SYSTEM_PROMPT = `You extract structured project information from a document (a project charter, brief, or kickoff note). Return ONLY a JSON object with this exact shape:

{
  "name": string,
  "status": "on-track" | "at-risk" | "off-track",
  "budgetPlanned": number,
  "startDate": "YYYY-MM-DD",
  "targetDate": "YYYY-MM-DD",
  "milestones": [{ "name": string, "dueDate": "YYYY-MM-DD" }]
}

Only use values explicitly stated or clearly implied in the document. If a field isn't mentioned, use these defaults instead of guessing: status "on-track", budgetPlanned 0, startDate today, targetDate 90 days after startDate, milestones: []. Never invent specific numbers, dates, or milestone names that aren't in the document.`;

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

export async function extractProjectFromDocument(content: string): Promise<ExtractedProject> {
  const raw = (await completeJson([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content },
  ])) as Record<string, unknown>;

  const today = new Date();
  const defaultTarget = new Date(today);
  defaultTarget.setDate(defaultTarget.getDate() + 90);

  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Untitled Project";
  const status = VALID_STATUSES.includes(raw.status as ProjectStatus) ? (raw.status as ProjectStatus) : "on-track";
  const budgetPlanned = typeof raw.budgetPlanned === "number" && raw.budgetPlanned >= 0 ? raw.budgetPlanned : 0;
  const startDate = isValidDateString(raw.startDate) ? raw.startDate : today.toISOString().slice(0, 10);
  const targetDate = isValidDateString(raw.targetDate) ? raw.targetDate : defaultTarget.toISOString().slice(0, 10);

  const milestones = Array.isArray(raw.milestones)
    ? raw.milestones
        .filter(
          (m): m is { name: string; dueDate: string } =>
            typeof m === "object" &&
            m !== null &&
            typeof (m as Record<string, unknown>).name === "string" &&
            isValidDateString((m as Record<string, unknown>).dueDate)
        )
        .map((m) => ({ name: m.name, dueDate: m.dueDate }))
    : [];

  return { name, status, budgetPlanned, startDate, targetDate, milestones };
}
