import Link from "next/link";
import Badge from "@/components/Badge";
import type { SignalWithProject } from "@/lib/sentinel";

const SOURCE_LABEL: Record<SignalWithProject["source"], string> = {
  ticket: "Ticket",
  document: "Document",
  project: "Project",
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function SignalsFeed({ signals }: { signals: SignalWithProject[] }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Signals</h3>
        <span className="text-xs text-slate-400">The Sentinel — watching in the background</span>
      </div>

      <ul className="mt-3 space-y-3 max-h-80 overflow-y-auto">
        {signals.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge value={s.severity} />
                <span className="text-xs text-slate-400">{SOURCE_LABEL[s.source]}</span>
                <Link href={`/projects/${s.projectId}`} className="text-xs font-medium text-blue-700 hover:underline">
                  {s.projectName}
                </Link>
              </div>
              <div className="text-sm text-slate-700 mt-1">{s.summary}</div>
              {s.escalatedReportId && (
                <div className="text-xs text-amber-600 mt-1">Escalated to Reports for review</div>
              )}
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(s.createdAt)}</span>
          </li>
        ))}
        {signals.length === 0 && (
          <li className="text-sm text-slate-400">All quiet — nothing flagged yet.</li>
        )}
      </ul>
    </div>
  );
}
