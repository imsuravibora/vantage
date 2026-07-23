import Groq from "groq-sdk";

let client: Groq | null = null;

function getGroq() {
  if (client) return client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY environment variable");
  client = new Groq({ apiKey });
  return client;
}

// Free-tier, fast, and good enough for grounded Q&A / report drafting.
// (llama-3.3-70b-versatile was deprecated by Groq on 2026-06-17; this is their recommended replacement.)
const MODEL = "openai/gpt-oss-120b";

export async function completeChat(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.2,
  });
  return completion.choices[0]?.message?.content ?? "";
}
