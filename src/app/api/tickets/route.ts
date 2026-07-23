import { NextResponse } from "next/server";
import { createTicket } from "@/lib/tickets";
import { requireRole, AuthError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireRole("project_manager");
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
  if (typeof assigneeId !== "string" || !assigneeId) {
    return NextResponse.json({ error: "'assigneeId' must be a non-empty string" }, { status: 400 });
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

  try {
    const ticket = await createTicket({ projectId, assigneeId, title: title.trim(), storyPoints, sprint });
    return NextResponse.json({ ticket });
  } catch (err) {
    console.error("[/api/tickets] failed:", err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to create ticket" }, { status: 500 });
  }
}
