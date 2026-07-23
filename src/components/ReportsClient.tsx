"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import MarkdownContent from "@/components/MarkdownContent";
import type { ReportRow } from "@/lib/reports";

export default function ReportsClient({
  initialReports,
  projects,
}: {
  initialReports: ReportRow[];
  projects: { id: string; name: string }[];
}) {
  const [reports, setReports] = useState<ReportRow[]>(initialReports);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [reviewerName, setReviewerName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  async function generateReport() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedProjectId ? { projectId: selectedProjectId } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate report");
      setReports((prev) => [data.report, ...prev]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function review(id: number, action: "approve" | "reject") {
    if (!reviewerName.trim()) {
      setError("Enter your name before approving or rejecting a report.");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewerName: reviewerName.trim(),
          editedContent: editing[id],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to review report");
      setReports((prev) => prev.map((r) => (r.id === id ? data.report : r)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-slate-500 mt-1">
        AI drafts an executive summary; a human reviews, edits, and approves before it counts as published.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3 border border-slate-200 rounded-lg p-4 bg-white">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Scope</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Org-wide</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Your name (for review)</label>
          <input
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="e.g. Jordan"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {generating ? "Drafting..." : "Generate report"}
        </button>
      </div>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      <div className="mt-6 space-y-4">
        {reports.length === 0 && <div className="text-sm text-slate-400">No reports yet — generate one above.</div>}
        {reports.map((report) => (
          <div key={report.id} className="border border-slate-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{report.title}</h3>
              <Badge value={report.status} />
            </div>
            <div className="text-xs text-slate-400 mt-1">{new Date(report.created_at).toLocaleString()}</div>

            {report.status === "pending-review" ? (
              <textarea
                value={editing[report.id] ?? report.draft_content}
                onChange={(e) => setEditing((prev) => ({ ...prev, [report.id]: e.target.value }))}
                rows={6}
                className="mt-3 w-full rounded-md border border-slate-300 p-2 text-sm"
              />
            ) : (
              <div className="mt-3">
                <MarkdownContent content={report.final_content ?? report.draft_content} />
              </div>
            )}

            {report.status === "pending-review" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => review(report.id, "approve")}
                  disabled={busyId === report.id}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => review(report.id, "reject")}
                  disabled={busyId === report.id}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}

            {report.status !== "pending-review" && (
              <div className="mt-2 text-xs text-slate-400">
                {report.status === "approved" ? "Approved" : "Rejected"} by {report.reviewed_by} on{" "}
                {report.reviewed_at ? new Date(report.reviewed_at).toLocaleString() : "—"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
