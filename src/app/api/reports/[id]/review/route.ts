import { NextResponse } from "next/server";
import { reviewReport } from "@/lib/reports";
import { requireRole, AuthError } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let reviewer;
  try {
    reviewer = await requireRole("management");
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

  const { action, editedContent } = body as { action?: unknown; editedContent?: unknown };

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "'action' must be 'approve' or 'reject'" }, { status: 400 });
  }
  if (editedContent !== undefined && typeof editedContent !== "string") {
    return NextResponse.json({ error: "'editedContent' must be a string if provided" }, { status: 400 });
  }

  try {
    const report = await reviewReport(id, action, reviewer.fullName ?? reviewer.email, editedContent);
    return NextResponse.json({ report });
  } catch (err) {
    console.error(`[/api/reports/${id}/review] failed:`, err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to review report" }, { status: 500 });
  }
}
