"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { ClipboardList, Sparkles, Check, X, Download, MessageSquare } from "lucide-react";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import Button from "@/components/Button";
import MarkdownContent from "@/components/MarkdownContent";
import { downloadReportPdf } from "@/lib/pdf";
import { INPUT_CLASS, LABEL_CLASS } from "@/lib/ui";
import type { ReportRow } from "@/lib/reports";
import type { FeedbackRow } from "@/lib/feedback";
import type { Profile } from "@/lib/types";

function celebrate() {
  confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
}

export default function ReportsClient({
  initialReports,
  initialFeedback,
  projects,
  currentUser,
}: {
  initialReports: ReportRow[];
  initialFeedback: FeedbackRow[];
  projects: { id: string; name: string }[];
  currentUser: Profile;
}) {
  const [reports, setReports] = useState<ReportRow[]>(initialReports);
  const [feedback, setFeedback] = useState<FeedbackRow[]>(initialFeedback);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [feedbackDraft, setFeedbackDraft] = useState<Record<number, string>>({});
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
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, editedContent: editing[id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to review report");
      setReports((prev) => prev.map((r) => (r.id === id ? data.report : r)));
      if (action === "approve") celebrate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function submitFeedback(reportId: number) {
    const comment = (feedbackDraft[reportId] ?? "").trim();
    if (!comment) return;
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add feedback");
      setFeedback((prev) => [...prev, data.feedback]);
      setFeedbackDraft((prev) => ({ ...prev, [reportId]: "" }));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
        <ClipboardList className="h-5 w-5 text-brand-500" />
        Reports
      </h1>
      <p className="text-slate-500 mt-1">
        AI drafts an executive summary; a human reviews, edits, and approves before it counts as published.
      </p>

      <Card className="mt-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className={LABEL_CLASS}>Scope</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/60"
          >
            <option value="">Org-wide</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={generateReport} disabled={generating}>
          {generating ? "Drafting..." : "Generate report"}
          {!generating && <Sparkles className="h-3.5 w-3.5" />}
        </Button>
      </Card>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      <div className="mt-6 space-y-4">
        {reports.length === 0 && (
          <div className="text-sm text-slate-400">No reports yet — the AI&apos;s pen is still capped. Generate one above.</div>
        )}
        {reports.map((report) => {
          const reportFeedback = feedback.filter((f) => f.report_id === report.id);
          return (
            <Card key={report.id} className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{report.title}</h3>
                <Badge value={report.status} />
              </div>
              <div className="text-xs text-slate-400 mt-1">{new Date(report.created_at).toLocaleString()}</div>

              {report.status === "pending-review" ? (
                <textarea
                  value={editing[report.id] ?? report.draft_content}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [report.id]: e.target.value }))}
                  rows={6}
                  className={`mt-3 ${INPUT_CLASS}`}
                />
              ) : (
                <div className="mt-3">
                  <MarkdownContent content={report.final_content ?? report.draft_content} />
                </div>
              )}

              {report.status === "pending-review" && (
                <div className="mt-3 flex gap-2">
                  <Button variant="success" size="sm" onClick={() => review(report.id, "approve")} disabled={busyId === report.id}>
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => review(report.id, "reject")} disabled={busyId === report.id}>
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}

              {report.status !== "pending-review" && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {report.status === "approved" ? "Approved" : "Rejected"} by {report.reviewed_by} on{" "}
                    {report.reviewed_at ? new Date(report.reviewed_at).toLocaleString() : "—"}
                  </div>
                  {report.status === "approved" && (
                    <Button variant="secondary" size="sm" onClick={() => downloadReportPdf(report)}>
                      <Download className="h-3 w-3" /> Download PDF
                    </Button>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <MessageSquare className="h-3.5 w-3.5" /> Leadership feedback
                </div>
                <ul className="mt-2 space-y-2">
                  {reportFeedback.map((f) => (
                    <li key={f.id} className="text-sm">
                      <span className="font-medium text-slate-800">{f.author_name}</span>{" "}
                      <span className="text-xs text-slate-400">{new Date(f.created_at).toLocaleString()}</span>
                      <div className="text-slate-600">{f.comment}</div>
                    </li>
                  ))}
                  {reportFeedback.length === 0 && (
                    <li className="text-sm text-slate-400">No feedback yet — be the first to weigh in.</li>
                  )}
                </ul>
                <div className="mt-2 flex gap-2">
                  <input
                    value={feedbackDraft[report.id] ?? ""}
                    onChange={(e) => setFeedbackDraft((prev) => ({ ...prev, [report.id]: e.target.value }))}
                    placeholder={`Comment as ${currentUser.fullName ?? currentUser.email}...`}
                    className={`flex-1 ${INPUT_CLASS}`}
                  />
                  <Button variant="secondary" size="sm" onClick={() => submitFeedback(report.id)}>
                    Post
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
