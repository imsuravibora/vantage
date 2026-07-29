import Link from "next/link";
import { Radar, Ticket as TicketIcon, FileText, FolderKanban, ArrowUpRight } from "lucide-react";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import type { SignalWithProject } from "@/lib/sentinel";

const SOURCE_LABEL: Record<SignalWithProject["source"], string> = {
  ticket: "Ticket",
  document: "Document",
  project: "Project",
};

const SOURCE_ICON: Record<SignalWithProject["source"], React.ComponentType<{ className?: string }>> = {
  ticket: TicketIcon,
  document: FileText,
  project: FolderKanban,
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
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Radar className="h-4 w-4 text-slate-400" />
          Signals
        </h3>
        <span className="text-xs text-slate-400">The Sentinel — watching in the background</span>
      </div>

      <ul className="mt-3 space-y-1 max-h-80 overflow-y-auto">
        {signals.map((s) => {
          const SourceIcon = SOURCE_ICON[s.source];
          return (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 -mx-2 transition-colors hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <div className="min-w-0 flex gap-2.5">
                <SourceIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge value={s.severity} />
                    <span className="text-xs text-slate-400">{SOURCE_LABEL[s.source]}</span>
                    <Link
                      href={`/projects/${s.projectId}`}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      {s.projectName}
                    </Link>
                  </div>
                  <div className="text-sm text-slate-700 mt-1">{s.summary}</div>
                  {s.reason && <div className="text-xs text-slate-400 mt-0.5">Why: {s.reason}</div>}
                  {s.escalatedReportId && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                      <ArrowUpRight className="h-3 w-3" /> Escalated to Reports for review
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(s.createdAt)}</span>
            </li>
          );
        })}
        {signals.length === 0 && <li className="text-sm text-slate-400 py-2">All quiet — nothing flagged yet.</li>}
      </ul>
    </Card>
  );
}
