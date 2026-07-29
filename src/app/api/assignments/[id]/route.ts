import { NextResponse } from "next/server";
import { unassignPmFromProject } from "@/lib/assignments";
import { requireRole, AuthError } from "@/lib/auth";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("management");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const { id } = await context.params;
  const assignmentId = Number(id);
  if (!Number.isInteger(assignmentId)) {
    return NextResponse.json({ error: "Invalid assignment id" }, { status: 400 });
  }

  try {
    await unassignPmFromProject(assignmentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[/api/assignments/${id}] failed:`, err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to remove assignment" }, { status: 500 });
  }
}
