import { NextResponse } from "next/server";
import { createProjectFromDocument } from "@/lib/documents";
import { requireRole, AuthError } from "@/lib/auth";

const MAX_CONTENT_LENGTH = 200_000;

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

  const { teamId, fileName, content } = body as { teamId?: unknown; fileName?: unknown; content?: unknown };

  if (typeof teamId !== "string" || teamId.trim().length === 0) {
    return NextResponse.json({ error: "'teamId' must be a non-empty string" }, { status: 400 });
  }
  if (typeof fileName !== "string" || fileName.trim().length === 0) {
    return NextResponse.json({ error: "'fileName' must be a non-empty string" }, { status: 400 });
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "'content' must be a non-empty string" }, { status: 400 });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: `'content' is too long (max ${MAX_CONTENT_LENGTH} characters)` }, { status: 400 });
  }

  try {
    const { projectId, extracted } = await createProjectFromDocument(teamId, fileName.trim(), content);
    return NextResponse.json({ projectId, extracted });
  } catch (err) {
    console.error("[/api/projects/create-from-document] failed:", err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to create project" }, { status: 500 });
  }
}
