import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/rag";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = (body as { question?: unknown })?.question;
  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ error: "'question' must be a non-empty string" }, { status: 400 });
  }
  if (question.length > 1000) {
    return NextResponse.json({ error: "'question' is too long (max 1000 characters)" }, { status: 400 });
  }

  try {
    const result = await answerQuestion(question.trim());
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/ask] failed:", err);
    return NextResponse.json({ error: "Failed to answer question" }, { status: 500 });
  }
}
