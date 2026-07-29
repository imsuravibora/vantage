import { NextResponse } from "next/server";
import { updateTicketStatus, getEngineerIdForProfile, getTicketAssignee } from "@/lib/tickets";
import { requireAuth, AuthError } from "@/lib/auth";
import type { TicketStatus } from "@/lib/types";

const VALID_STATUSES: TicketStatus[] = ["todo", "in-progress", "done", "blocked"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  let profile;
  try {
    profile = await requireAuth();
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const { id } = await context.params;

  if (profile.role === "management") {
    return NextResponse.json({ error: "Not authorized for this action" }, { status: 403 });
  }

  if (profile.role === "engineer") {
    const [engineerId, assigneeId] = await Promise.all([
      getEngineerIdForProfile(profile.id),
      getTicketAssignee(id),
    ]);
    if (!engineerId || assigneeId !== engineerId) {
      return NextResponse.json({ error: "You can only update tickets assigned to you." }, { status: 403 });
    }
  }

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
