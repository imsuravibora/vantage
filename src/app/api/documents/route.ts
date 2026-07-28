import { NextResponse } from "next/server";
import { ingestDocument } from "@/lib/documents";
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

  const { projectId, title, content, confidential } = body as {
    projectId?: unknown;
    title?: unknown;
    content?: unknown;
    confidential?: unknown;
  };

  if (typeof projectId !== "string" || projectId.trim().length === 0) {
    return NextResponse.json({ error: "'projectId' must be a non-empty string" }, { status: 400 });
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "'title' must be a non-empty string" }, { status: 400 });
  }
  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "'content' must be a non-empty string" }, { status: 400 });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: `'content' is too long (max ${MAX_CONTENT_LENGTH} characters)` }, { status: 400 });
  }

  try {
    const { docId } = await ingestDocument(projectId, title.trim(), content, confidential === true);
    return NextResponse.json({ docId });
  } catch (err) {
    console.error("[/api/documents] failed:", err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to save document" }, { status: 500 });
  }
}
