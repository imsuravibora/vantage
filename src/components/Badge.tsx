const COLOR_MAP: Record<string, string> = {
  // risk / status levels
  low: "bg-emerald-100 text-emerald-800",
  "on-track": "bg-emerald-100 text-emerald-800",
  balanced: "bg-emerald-100 text-emerald-800",
  approved: "bg-emerald-100 text-emerald-800",
  resolved: "bg-emerald-100 text-emerald-800",

  medium: "bg-amber-100 text-amber-800",
  "at-risk": "bg-amber-100 text-amber-800",
  underloaded: "bg-amber-100 text-amber-800",
  "pending-review": "bg-amber-100 text-amber-800",

  high: "bg-red-100 text-red-800",
  "off-track": "bg-red-100 text-red-800",
  overloaded: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
  critical: "bg-red-100 text-red-800",

  blocked: "bg-red-100 text-red-800",
  "in-progress": "bg-blue-100 text-blue-800",
  todo: "bg-slate-100 text-slate-700",
  done: "bg-emerald-100 text-emerald-800",

  minor: "bg-slate-100 text-slate-700",
  moderate: "bg-amber-100 text-amber-800",
  major: "bg-red-100 text-red-800",
};

export default function Badge({ value, label }: { value: string; label?: string }) {
  const className = COLOR_MAP[value] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label ?? value}
    </span>
  );
}
