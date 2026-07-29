import { NextResponse } from "next/server";
import { claimTicket, getEngineerIdForProfile } from "@/lib/tickets";
import { requireRole, AuthError } from "@/lib/auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let profile;
  try {
    profile = await requireRole("engineer");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const { id } = await context.params;

  const engineerId = await getEngineerIdForProfile(profile.id);
  if (!engineerId) {
    return NextResponse.json({ error: "This account isn't linked to an engineer record." }, { status: 403 });
  }

  try {
    const ticket = await claimTicket(id, engineerId);
    return NextResponse.json({ ticket });
  } catch (err) {
    console.error(`[/api/tickets/${id}/claim] failed:`, err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to claim ticket" }, { status: 500 });
  }
}
