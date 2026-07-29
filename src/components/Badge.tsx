const COLOR_MAP: Record<string, string> = {
  // risk / status levels
  low: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "on-track": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  balanced: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",

  medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "at-risk": "bg-amber-50 text-amber-700 ring-amber-600/20",
  underloaded: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "pending-review": "bg-amber-50 text-amber-700 ring-amber-600/20",

  high: "bg-red-50 text-red-700 ring-red-600/20",
  "off-track": "bg-red-50 text-red-700 ring-red-600/20",
  overloaded: "bg-red-50 text-red-700 ring-red-600/20",
  rejected: "bg-red-50 text-red-700 ring-red-600/20",
  critical: "bg-red-50 text-red-700 ring-red-600/20",

  blocked: "bg-red-50 text-red-700 ring-red-600/20",
  "in-progress": "bg-blue-50 text-blue-700 ring-blue-600/20",
  todo: "bg-slate-100 text-slate-600 ring-slate-500/20",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",

  minor: "bg-slate-100 text-slate-600 ring-slate-500/20",
  moderate: "bg-amber-50 text-amber-700 ring-amber-600/20",
  major: "bg-red-50 text-red-700 ring-red-600/20",

  confidential: "bg-slate-800 text-slate-100 ring-slate-700",
};

const DOT_MAP: Record<string, string> = {
  low: "bg-emerald-500",
  "on-track": "bg-emerald-500",
  balanced: "bg-emerald-500",
  approved: "bg-emerald-500",
  resolved: "bg-emerald-500",
  done: "bg-emerald-500",

  medium: "bg-amber-500",
  "at-risk": "bg-amber-500",
  underloaded: "bg-amber-500",
  "pending-review": "bg-amber-500",
  moderate: "bg-amber-500",

  high: "bg-red-500",
  "off-track": "bg-red-500",
  overloaded: "bg-red-500",
  rejected: "bg-red-500",
  critical: "bg-red-500",
  blocked: "bg-red-500",
  major: "bg-red-500",

  "in-progress": "bg-blue-500",
  todo: "bg-slate-400",
  minor: "bg-slate-400",
  draft: "bg-slate-400",
};

export default function Badge({ value, label }: { value: string; label?: string }) {
  const className = COLOR_MAP[value] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  const dot = DOT_MAP[value];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label ?? value}
    </span>
  );
}
