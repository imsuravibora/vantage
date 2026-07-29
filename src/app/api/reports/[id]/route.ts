import { NextResponse } from "next/server";
import { updateDraftContent } from "@/lib/reports";
import { requireRole, AuthError } from "@/lib/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  let profile;
  try {
    profile = await requireRole("project_manager");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = (body as { content?: unknown })?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "'content' must be a non-empty string" }, { status: 400 });
  }

  try {
    const report = await updateDraftContent(id, profile.id, content);
    return NextResponse.json({ report });
  } catch (err) {
    console.error(`[/api/reports/${id}] failed:`, err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to update draft" }, { status: 500 });
  }
}
