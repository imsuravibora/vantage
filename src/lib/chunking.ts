// Splits text into overlapping word-count chunks so long docs still retrieve well;
// short docs (most of our narrative corpus) come back as a single chunk.
export function chunkText(text: string, chunkWords = 180, overlapWords = 40): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length <= chunkWords) return [text.trim()];

  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - overlapWords;
  }
  return chunks;
}
