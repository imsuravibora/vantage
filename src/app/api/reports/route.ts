import { NextResponse } from "next/server";
import { listReports } from "@/lib/reports";
import type { ReportStatus } from "@/lib/types";

const VALID_STATUSES: ReportStatus[] = ["pending-review", "approved", "rejected"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  if (statusParam && !VALID_STATUSES.includes(statusParam as ReportStatus)) {
    return NextResponse.json({ error: `Invalid status filter: ${statusParam}` }, { status: 400 });
  }

  try {
    const reports = await listReports(statusParam as ReportStatus | undefined);
    return NextResponse.json({ reports });
  } catch (err) {
    console.error("[/api/reports] failed:", err);
    return NextResponse.json({ error: "Failed to list reports" }, { status: 500 });
  }
}
