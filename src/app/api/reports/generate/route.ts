import { NextResponse } from "next/server";
import { draftExecutiveReport } from "@/lib/reports";
import { listAssignedProjectIds } from "@/lib/assignments";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(request: Request) {
  let profile;
  try {
    profile = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const projectId = (body as { projectId?: unknown })?.projectId;
  if (projectId !== undefined && typeof projectId !== "string") {
    return NextResponse.json({ error: "'projectId' must be a string if provided" }, { status: 400 });
  }

  if (profile.role === "project_manager") {
    if (!projectId) {
      return NextResponse.json(
        { error: "Project Managers must pick a project — org-wide reports are Management-only." },
        { status: 400 }
      );
    }
    const assigned = await listAssignedProjectIds(profile.id);
    if (!assigned.includes(projectId)) {
      return NextResponse.json({ error: "You're not assigned to that project." }, { status: 403 });
    }
  }

  try {
    const report = await draftExecutiveReport(projectId, profile);
    return NextResponse.json({ report });
  } catch (err) {
    console.error("[/api/reports/generate] failed:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
