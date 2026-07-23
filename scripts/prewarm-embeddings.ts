// Downloads and loads the local embedding model once, at build time, so the
// first real request after a deploy doesn't pay for the ~90MB model download.
import { embedText } from "../src/lib/embeddings";

async function main() {
  await embedText("warm up");
  console.log("Embedding model pre-warmed.");
}

main().catch((err) => {
  console.error("Failed to pre-warm embedding model:", err);
  process.exit(1);
});
