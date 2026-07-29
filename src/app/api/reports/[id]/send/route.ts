import { NextResponse } from "next/server";
import { sendReportForReview } from "@/lib/reports";
import { requireRole, AuthError } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  try {
    const report = await sendReportForReview(id, profile.id);
    return NextResponse.json({ report });
  } catch (err) {
    console.error(`[/api/reports/${id}/send] failed:`, err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to send report" }, { status: 500 });
  }
}
