"use client";

import { useState } from "react";
import type { RagSource } from "@/lib/rag";

const SAMPLE_QUESTIONS = [
  "Why is Phoenix at risk?",
  "Which projects have unresolved security findings?",
  "What caused the recent sev1 incident?",
];

export default function AskChat() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<RagSource[]>([]);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setAnswer(data.answer);
      setSources(data.sources ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Ask AI</h1>
      <p className="text-slate-500 mt-1">
        Ask a question in plain language — answers are grounded in real retros, postmortems, and status updates, with sources cited.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {SAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuestion(q);
              ask(q);
            }}
            className="text-xs rounded-full border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-100"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about risk, budget, incidents, security..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      {answer && (
        <div className="mt-6 border border-slate-200 rounded-lg p-4 bg-white">
          <div className="text-sm whitespace-pre-wrap">{answer}</div>
          {sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sources</div>
              <ul className="mt-2 space-y-2">
                {sources.map((s, i) => (
                  <li key={`${s.docId}-${i}`} className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      [{i + 1}] {s.projectName} — {s.docTitle}
                    </span>
                    <div className="mt-1 text-slate-400">{s.content}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
