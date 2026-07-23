import { NextResponse } from "next/server";
import { addFeedback } from "@/lib/feedback";
import { requireRole, AuthError } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let author;
  try {
    author = await requireRole("management");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const { id: idParam } = await context.params;
  const reportId = Number(idParam);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const comment = (body as { comment?: unknown })?.comment;
  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json({ error: "'comment' must be a non-empty string" }, { status: 400 });
  }
  if (comment.length > 2000) {
    return NextResponse.json({ error: "'comment' is too long (max 2000 characters)" }, { status: 400 });
  }

  try {
    const feedback = await addFeedback(reportId, author.id, author.fullName ?? author.email, comment.trim());
    return NextResponse.json({ feedback });
  } catch (err) {
    console.error(`[/api/reports/${reportId}/feedback] failed:`, err);
    return NextResponse.json({ error: "Failed to add feedback" }, { status: 500 });
  }
}
