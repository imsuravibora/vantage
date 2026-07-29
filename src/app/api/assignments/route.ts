import { NextResponse } from "next/server";
import { assignPmToProject } from "@/lib/assignments";
import { requireRole, AuthError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireRole("management");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { profileId, projectId } = body as { profileId?: unknown; projectId?: unknown };
  if (typeof profileId !== "string" || profileId.trim().length === 0) {
    return NextResponse.json({ error: "'profileId' must be a non-empty string" }, { status: 400 });
  }
  if (typeof projectId !== "string" || projectId.trim().length === 0) {
    return NextResponse.json({ error: "'projectId' must be a non-empty string" }, { status: 400 });
  }

  try {
    const id = await assignPmToProject(profileId, projectId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error("[/api/assignments] failed:", err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to assign" }, { status: 500 });
  }
}
