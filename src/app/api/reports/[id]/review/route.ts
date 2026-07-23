import { NextResponse } from "next/server";
import { reviewReport } from "@/lib/reports";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const { action, reviewerName, editedContent } = body as {
    action?: unknown;
    reviewerName?: unknown;
    editedContent?: unknown;
  };

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "'action' must be 'approve' or 'reject'" }, { status: 400 });
  }
  if (typeof reviewerName !== "string" || reviewerName.trim().length === 0) {
    return NextResponse.json({ error: "'reviewerName' must be a non-empty string" }, { status: 400 });
  }
  if (editedContent !== undefined && typeof editedContent !== "string") {
    return NextResponse.json({ error: "'editedContent' must be a string if provided" }, { status: 400 });
  }

  try {
    const report = await reviewReport(id, action, reviewerName.trim(), editedContent);
    return NextResponse.json({ report });
  } catch (err) {
    console.error(`[/api/reports/${id}/review] failed:`, err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to review report" }, { status: 500 });
  }
}
