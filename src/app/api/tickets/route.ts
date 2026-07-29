import { NextResponse } from "next/server";
import { createTicket } from "@/lib/tickets";
import { requireAuth, AuthError } from "@/lib/auth";

export async function POST(request: Request) {
  let profile;
  try {
    profile = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  if (profile.role === "management") {
    return NextResponse.json({ error: "Not authorized for this action" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, assigneeId, title, storyPoints, sprint } = body as {
    projectId?: unknown;
    assigneeId?: unknown;
    title?: unknown;
    storyPoints?: unknown;
    sprint?: unknown;
  };

  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json({ error: "'projectId' must be a non-empty string" }, { status: 400 });
  }
  if (assigneeId !== undefined && assigneeId !== null && typeof assigneeId !== "string") {
    return NextResponse.json({ error: "'assigneeId' must be a string or null" }, { status: 400 });
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "'title' must be a non-empty string" }, { status: 400 });
  }
  if (typeof storyPoints !== "number" || storyPoints <= 0) {
    return NextResponse.json({ error: "'storyPoints' must be a positive number" }, { status: 400 });
  }
  if (typeof sprint !== "number" || sprint <= 0) {
    return NextResponse.json({ error: "'sprint' must be a positive number" }, { status: 400 });
  }

  // Engineers can request work from another team (finance, design, etc.) but
  // always drop it in the unassigned pool -- they can't hand it to a specific
  // person, only a PM can do that at creation time.
  const resolvedAssigneeId = profile.role === "engineer" ? null : (assigneeId as string | null | undefined) ?? null;

  try {
    const ticket = await createTicket({
      projectId,
      assigneeId: resolvedAssigneeId,
      title: title.trim(),
      storyPoints,
      sprint,
    });
    return NextResponse.json({ ticket });
  } catch (err) {
    console.error("[/api/tickets] failed:", err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to create ticket" }, { status: 500 });
  }
}
