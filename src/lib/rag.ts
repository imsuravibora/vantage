import { getSupabase } from "./supabase";
import { embedText } from "./embeddings";
import { completeChat } from "./groq";

export interface RagSource {
  docId: string;
  docTitle: string;
  projectName: string;
  content: string;
  similarity: number;
}

export interface RagAnswer {
  answer: string;
  sources: RagSource[];
}

const SYSTEM_PROMPT = `You are Vantage, an AI assistant for engineering leadership. Answer the question using ONLY the provided context excerpts from real project retros, postmortems, and status updates. If the context doesn't contain the answer, say so plainly instead of guessing. Be concise and specific — cite which project each fact comes from. Do not invent numbers or facts not present in the context.`;

export async function answerQuestion(question: string, matchCount = 6): Promise<RagAnswer> {
  const supabase = getSupabase();

  const queryEmbedding = await embedText(question);

  const { data: matches, error: matchError } = await supabase.rpc("match_doc_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });
  if (matchError) throw new Error(`Vector search failed: ${matchError.message}`);

  const rows = (matches ?? []) as {
    id: number;
    doc_id: string;
    project_id: string;
    content: string;
    similarity: number;
  }[];

  if (rows.length === 0) {
    return { answer: "I don't have any indexed project data to answer that yet.", sources: [] };
  }

  const docIds = [...new Set(rows.map((r) => r.doc_id))];
  const projectIds = [...new Set(rows.map((r) => r.project_id))];

  const [{ data: docs }, { data: projects }] = await Promise.all([
    supabase.from("narrative_docs").select("id, title").in("id", docIds),
    supabase.from("projects").select("id, name").in("id", projectIds),
  ]);

  const docTitleById = new Map((docs ?? []).map((d) => [d.id as string, d.title as string]));
  const projectNameById = new Map((projects ?? []).map((p) => [p.id as string, p.name as string]));

  const sources: RagSource[] = rows.map((r) => ({
    docId: r.doc_id,
    docTitle: docTitleById.get(r.doc_id) ?? r.doc_id,
    projectName: projectNameById.get(r.project_id) ?? r.project_id,
    content: r.content,
    similarity: r.similarity,
  }));

  const context = sources
    .map((s, i) => `[${i + 1}] (${s.projectName} — ${s.docTitle})\n${s.content}`)
    .join("\n\n");

  const answer = await completeChat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Context:\n\n${context}\n\nQuestion: ${question}` },
  ]);

  return { answer, sources };
}
