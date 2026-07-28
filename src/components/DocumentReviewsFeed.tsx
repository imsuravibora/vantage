import Link from "next/link";
import { ScrollText, Lock, Building2 } from "lucide-react";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import type { DocumentReviewWithMeta, UserRole } from "@/lib/types";

const CATEGORY_LABELS: { key: keyof Pick<DocumentReviewWithMeta, "compliance" | "security" | "timelines" | "risks" | "terms" | "agreements">; label: string }[] = [
  { key: "compliance", label: "Compliance" },
  { key: "security", label: "Security" },
  { key: "timelines", label: "Timelines" },
  { key: "risks", label: "Risks" },
  { key: "terms", label: "Terms" },
  { key: "agreements", label: "Agreements" },
];

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function DocumentReviewsFeed({
  reviews,
  viewerRole,
}: {
  reviews: DocumentReviewWithMeta[];
  viewerRole: UserRole;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <ScrollText className="h-4 w-4 text-slate-400" />
          Document reviews
        </h3>
        <span className="text-xs text-slate-400">The Sentinel — read in full on upload</span>
      </div>

      <ul className="mt-3 space-y-4 max-h-[32rem] overflow-y-auto">
        {reviews.map((r) => {
          const restricted = r.confidential && viewerRole !== "management";
          return (
            <li key={r.id} className="rounded-lg border-b border-slate-100 px-1 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-sm font-medium text-slate-800 truncate">{r.docTitle}</span>
                  {r.confidential && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-100 ring-1 ring-inset ring-slate-700">
                      <Lock className="h-3 w-3" />
                      confidential
                    </span>
                  )}
                  <Link
                    href={`/projects/${r.projectId}`}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    {r.projectName}
                  </Link>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(r.createdAt)}</span>
              </div>

              {restricted ? (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-400 italic">
                  <Lock className="h-3.5 w-3.5" /> Restricted to Management.
                </div>
              ) : (
                <>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge value={r.severity} />
                    {r.departments.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Building2 className="h-3 w-3" /> Route to: {r.departments.join(", ")}
                      </span>
                    )}
                  </div>

                  {r.mustRead.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700">
                      {r.mustRead.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 p-3">
                    {CATEGORY_LABELS.filter(({ key }) => r[key].length > 0).map(({ key, label }) => (
                      <div key={key} className="text-xs text-slate-500">
                        <span className="font-medium text-slate-600">{label}:</span> {r[key].join("; ")}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </li>
          );
        })}
        {reviews.length === 0 && <li className="text-sm text-slate-400 py-2">No documents reviewed yet.</li>}
      </ul>
    </Card>
  );
}
