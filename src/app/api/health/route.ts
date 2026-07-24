import { NextResponse } from "next/server";
import { embedText } from "@/lib/embeddings";

// Pinged by an uptime monitor to stop Render's free tier from spinning the
// service down after inactivity. Responds immediately; the embedding call
// runs in the background purely to keep that pipeline warm too, so Ask AI
// doesn't pay a cold-start cost on the next real request.
export async function GET() {
  embedText("healthcheck").catch(() => {});
  return NextResponse.json({ status: "ok" });
}
