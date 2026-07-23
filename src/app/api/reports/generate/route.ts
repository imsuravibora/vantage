import { NextResponse } from "next/server";
import { draftExecutiveReport } from "@/lib/reports";
import { requireRole, AuthError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireRole("management");
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

  try {
    const report = await draftExecutiveReport(projectId);
    return NextResponse.json({ report });
  } catch (err) {
    console.error("[/api/reports/generate] failed:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
