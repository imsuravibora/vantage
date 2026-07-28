"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Lock, CheckCircle2, Upload } from "lucide-react";
import Button from "@/components/Button";
import { INPUT_CLASS, LABEL_CLASS } from "@/lib/ui";

type Mode = "existing" | "new";

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export default function DocumentUploadClient({
  projects,
  teams,
}: {
  projects: { id: string; name: string }[];
  teams: { id: string; name: string }[];
}) {
  const [mode, setMode] = useState<Mode>("existing");
  const [file, setFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [confidential, setConfidential] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | { kind: "existing"; docId: string; title: string }
    | { kind: "new"; projectId: string; name: string }
    | null
  >(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a .txt or .md file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const content = await readFileAsText(file);

      if (mode === "existing") {
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, title: title.trim() || file.name, content, confidential }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to upload document");
        setResult({ kind: "existing", docId: data.docId, title: title.trim() || file.name });
      } else {
        const res = await fetch("/api/projects/create-from-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId, fileName: file.name, content, confidential }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create project");
        setResult({ kind: "new", projectId: data.projectId, name: data.extracted.name });
      }
      setFile(null);
      setTitle("");
      setConfidential(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
        <FileText className="h-5 w-5 text-brand-500" />
        Documents
      </h1>
      <p className="text-slate-500 mt-1">
        Upload a project document. It becomes searchable via Ask AI immediately — or, for a brand-new project, AI
        extracts the key facts to spin up the project itself.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-card"
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "existing" ? "bg-slate-900 text-white shadow-sm" : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Add to existing project
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "new" ? "bg-slate-900 text-white shadow-sm" : "border border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Create new project
          </button>
        </div>

        {mode === "existing" ? (
          <>
            <div>
              <label className={LABEL_CLASS}>Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={INPUT_CLASS}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Title (optional)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Defaults to the file name"
                className={INPUT_CLASS}
              />
            </div>
          </>
        ) : (
          <div>
            <label className={LABEL_CLASS}>Team</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={INPUT_CLASS}>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={LABEL_CLASS}>Document (.txt or .md)</label>
          <input
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
          />
        </div>

        <label className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={confidential}
            onChange={(e) => setConfidential(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
          />
          <span>
            <span className="flex items-center gap-1.5 font-medium text-slate-800">
              <Lock className="h-3.5 w-3.5" /> Restrict to Management (confidential)
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              For sensitive documents like an MCA — the file and its review will only be visible to Management, not
              other Project Managers.
            </span>
          </span>
        </label>

        <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          On upload, the full text is sent once to our AI provider (Groq) to generate the review below. When someone
          later asks a question on Ask AI, only the specific matching passages are sent — never the whole document.
          Nothing is used to train other models.
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <Button type="submit" disabled={loading}>
          {loading ? "Processing..." : mode === "existing" ? "Upload document" : "Create project"}
          {!loading && <Upload className="h-3.5 w-3.5" />}
        </Button>
      </form>

      {result && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div>
            {result.kind === "existing" ? (
              <>&quot;{result.title}&quot; was added and indexed — ask about it on the Ask AI page.</>
            ) : (
              <>
                Created project <span className="font-semibold">{result.name}</span> from the document.{" "}
                <Link href={`/projects/${result.projectId}`} className="underline">
                  View it
                </Link>
                .
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
