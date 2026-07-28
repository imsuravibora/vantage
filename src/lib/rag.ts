import { getSupabase } from "./supabase-admin";
import { embedText, cosineSimilarity } from "./embeddings";
import { completeChat } from "./groq";
import type { UserRole } from "./types";

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

export async function answerQuestion(question: string, viewerRole: UserRole, matchCount = 6): Promise<RagAnswer> {
  const supabase = getSupabase();

  const queryEmbedding = await embedText(question);

  const { data: matches, error: matchError } = await supabase.rpc("match_doc_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });
  if (matchError) throw new Error(`Vector search failed: ${matchError.message}`);

  const allRows = (matches ?? []) as {
    id: number;
    doc_id: string;
    project_id: string;
    content: string;
    similarity: number;
  }[];

  if (allRows.length === 0) {
    return { answer: "I don't have any indexed project data to answer that yet.", sources: [] };
  }

  const docIds = [...new Set(allRows.map((r) => r.doc_id))];
  const projectIds = [...new Set(allRows.map((r) => r.project_id))];

  const [{ data: docs }, { data: projects }] = await Promise.all([
    supabase.from("narrative_docs").select("id, title, confidential").in("id", docIds),
    supabase.from("projects").select("id, name").in("id", projectIds),
  ]);

  const docMetaById = new Map(
    (docs ?? []).map((d) => [d.id as string, { title: d.title as string, confidential: d.confidential as boolean }])
  );
  const projectNameById = new Map((projects ?? []).map((p) => [p.id as string, p.name as string]));

  // Confidential documents are still reviewed and indexed, but a
  // non-Management viewer shouldn't get their content surfaced as a citation.
  const rows =
    viewerRole === "management" ? allRows : allRows.filter((r) => !docMetaById.get(r.doc_id)?.confidential);

  if (rows.length === 0) {
    return {
      answer: "The most relevant matches for that question are restricted to Management. Try a different question, or ask someone in Management.",
      sources: [],
    };
  }

  const sources: RagSource[] = rows.map((r) => ({
    docId: r.doc_id,
    docTitle: docMetaById.get(r.doc_id)?.title ?? r.doc_id,
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

// For report drafting: rather than dumping every note tagged to a project
// (which stops scaling once people start uploading real documents), rank
// this project's chunks by relevance to a query and return only the top few.
export async function getRelevantChunksForProject(
  projectId: string,
  query: string,
  topN = 8
): Promise<{ title: string; content: string }[]> {
  const supabase = getSupabase();
  const queryEmbedding = await embedText(query);

  const { data: chunks, error } = await supabase
    .from("doc_chunks")
    .select("doc_id, content, embedding")
    .eq("project_id", projectId);
  if (error) throw new Error(`Failed to fetch document chunks: ${error.message}`);
  if (!chunks || chunks.length === 0) return [];

  const ranked = chunks
    .map((c) => ({ ...c, similarity: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);

  const docIds = [...new Set(ranked.map((r) => r.doc_id))];
  const { data: docs } = await supabase.from("narrative_docs").select("id, title").in("id", docIds);
  const titleById = new Map((docs ?? []).map((d) => [d.id as string, d.title as string]));

  return ranked.map((r) => ({ title: titleById.get(r.doc_id) ?? r.doc_id, content: r.content }));
}
