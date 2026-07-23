import { NextResponse } from "next/server";
import { updateTicketStatus } from "@/lib/tickets";
import { requireRole, AuthError } from "@/lib/auth";
import type { TicketStatus } from "@/lib/types";

const VALID_STATUSES: TicketStatus[] = ["todo", "in-progress", "done", "blocked"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("project_manager");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = (body as { status?: unknown })?.status;
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as TicketStatus)) {
    return NextResponse.json({ error: `'status' must be one of ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  try {
    const ticket = await updateTicketStatus(id, status as TicketStatus);
    return NextResponse.json({ ticket });
  } catch (err) {
    console.error(`[/api/tickets/${id}] failed:`, err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to update ticket" }, { status: 500 });
  }
}
