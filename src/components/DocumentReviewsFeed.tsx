import Link from "next/link";
import Badge from "@/components/Badge";
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
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Document reviews</h3>
        <span className="text-xs text-slate-400">The Sentinel — read in full on upload</span>
      </div>

      <ul className="mt-3 space-y-4 max-h-[32rem] overflow-y-auto">
        {reviews.map((r) => {
          const restricted = r.confidential && viewerRole !== "management";
          return (
            <li key={r.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-sm font-medium text-slate-700 truncate">{r.docTitle}</span>
                  {r.confidential && <Badge value="confidential" label="🔒 confidential" />}
                  <Link href={`/projects/${r.projectId}`} className="text-xs font-medium text-blue-700 hover:underline">
                    {r.projectName}
                  </Link>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(r.createdAt)}</span>
              </div>

              {restricted ? (
                <div className="mt-2 text-sm text-slate-400 italic">Restricted to Management.</div>
              ) : (
                <>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge value={r.severity} />
                    {r.departments.length > 0 && (
                      <span className="text-xs text-slate-500">
                        Route to: {r.departments.join(", ")}
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

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
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
        {reviews.length === 0 && <li className="text-sm text-slate-400">No documents reviewed yet.</li>}
      </ul>
    </div>
  );
}
