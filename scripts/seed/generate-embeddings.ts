import { config } from "dotenv";
config({ path: ".env.local" });
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getSupabase } from "../../src/lib/supabase";
import { embedTexts } from "../../src/lib/embeddings";
import { chunkText } from "../../src/lib/chunking";
import type { Dataset } from "../../src/lib/types";

async function main() {
  const dataPath = path.resolve(__dirname, "output", "dataset.json");
  const raw = await fs.readFile(dataPath, "utf-8");
  const dataset: Dataset = JSON.parse(raw);
  const supabase = getSupabase();

  type PendingChunk = { doc_id: string; project_id: string; chunk_index: number; content: string };
  const pending: PendingChunk[] = [];

  for (const doc of dataset.narrativeDocs) {
    const chunks = chunkText(doc.content);
    chunks.forEach((content, chunkIndex) => {
      pending.push({ doc_id: doc.id, project_id: doc.projectId, chunk_index: chunkIndex, content });
    });
  }

  console.log(`Embedding ${pending.length} chunks from ${dataset.narrativeDocs.length} narrative docs...`);

  const BATCH_SIZE = 16;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const embeddings = await embedTexts(batch.map((c) => c.content));
    const rows = batch.map((c, idx) => ({ ...c, embedding: embeddings[idx] }));
    const { error } = await supabase.from("doc_chunks").insert(rows);
    if (error) throw new Error(`Insert into doc_chunks failed: ${error.message}`);
    console.log(`Embedded and stored ${Math.min(i + BATCH_SIZE, pending.length)}/${pending.length}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
