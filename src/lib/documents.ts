import { randomUUID } from "node:crypto";
import { getSupabase } from "./supabase-admin";
import { embedTexts } from "./embeddings";
import { chunkText } from "./chunking";
import { extractProjectFromDocument } from "./project-extraction";
import { reviewDocument } from "./sentinel";

export async function ingestDocument(projectId: string, title: string, content: string, confidential = false) {
  const supabase = getSupabase();
  const docId = `doc_${randomUUID().slice(0, 8)}`;

  const { error: docError } = await supabase.from("narrative_docs").insert({
    id: docId,
    project_id: projectId,
    type: "uploaded-doc",
    title,
    content,
    created_at: new Date().toISOString(),
    confidential,
  });
  if (docError) throw new Error(`Failed to save document: ${docError.message}`);

  const chunks = chunkText(content);
  const embeddings = await embedTexts(chunks);
  const rows = chunks.map((chunkContent, i) => ({
    doc_id: docId,
    project_id: projectId,
    chunk_index: i,
    content: chunkContent,
    embedding: embeddings[i],
  }));
  const { error: chunkError } = await supabase.from("doc_chunks").insert(rows);
  if (chunkError) throw new Error(`Failed to embed document: ${chunkError.message}`);

  // Fire-and-forget: the Sentinel reads the new document across several
  // categories in the background -- covers both "attach to existing project"
  // and the charter doc for a brand-new project, since this function backs both.
  reviewDocument(projectId, docId, content).catch((err) =>
    console.error("[sentinel] document review failed:", err)
  );

  return { docId };
}

export async function createProjectFromDocument(
  teamId: string,
  fileName: string,
  content: string,
  confidential = false
) {
  const extracted = await extractProjectFromDocument(content);
  const supabase = getSupabase();
  const projectId = `proj_${randomUUID().slice(0, 8)}`;

  const { error: projectError } = await supabase.from("projects").insert({
    id: projectId,
    name: extracted.name,
    team_id: teamId,
    status: extracted.status,
    start_date: extracted.startDate,
    target_date: extracted.targetDate,
    budget_planned: extracted.budgetPlanned,
    budget_spent: 0,
  });
  if (projectError) throw new Error(`Failed to create project: ${projectError.message}`);

  if (extracted.milestones.length > 0) {
    const milestoneRows = extracted.milestones.map((m) => ({
      id: `ms_${randomUUID().slice(0, 8)}`,
      project_id: projectId,
      name: m.name,
      due_date: m.dueDate,
      status: "on-track" as const,
    }));
    const { error: msError } = await supabase.from("milestones").insert(milestoneRows);
    if (msError) throw new Error(`Failed to create milestones: ${msError.message}`);
  }

  await ingestDocument(projectId, fileName, content, confidential);

  return { projectId, extracted };
}
