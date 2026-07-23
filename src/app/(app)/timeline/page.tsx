import Link from "next/link";
import { getDataset } from "@/lib/data-access";

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  "on-track": "bg-emerald-500",
  "at-risk": "bg-amber-500",
  "off-track": "bg-red-500",
};

function daysBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

export default async function TimelinePage() {
  const dataset = await getDataset();

  const allDates = dataset.milestones.map((m) => new Date(m.dueDate));
  if (allDates.length === 0) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-slate-400 mt-4">Nothing on the calendar yet.</p>
      </div>
    );
  }

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  // pad a week on each side so markers at the edges aren't clipped
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);
  const totalDays = daysBetween(minDate, maxDate);

  const today = new Date();
  const todayPct = Math.min(100, Math.max(0, (daysBetween(minDate, today) / totalDays) * 100));
  const showToday = today >= minDate && today <= maxDate;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Timeline</h1>
      <p className="text-slate-500 mt-1">Milestones across all projects, positioned by due date.</p>

      <div className="mt-6 border border-slate-200 rounded-lg bg-white p-6">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>{minDate.toISOString().slice(0, 10)}</span>
          <span>{maxDate.toISOString().slice(0, 10)}</span>
        </div>

        <div className="relative">
          {showToday && (
            <div
              className="absolute top-0 bottom-0 w-px bg-blue-400 z-10"
              style={{ left: `${todayPct}%` }}
              title={`Today: ${today.toISOString().slice(0, 10)}`}
            />
          )}

          <div className="space-y-6">
            {dataset.projects.map((project) => {
              const milestones = dataset.milestones.filter((m) => m.projectId === project.id);
              return (
                <div key={project.id}>
                  <Link href={`/projects/${project.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                    {project.name}
                  </Link>
                  <div className="relative h-8 mt-1 bg-slate-50 rounded-md border border-slate-100">
                    {milestones.map((m) => {
                      const pct = (daysBetween(minDate, new Date(m.dueDate)) / totalDays) * 100;
                      return (
                        <div
                          key={m.id}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-1.5"
                          style={{ left: `${pct}%` }}
                          title={`${m.name} — due ${m.dueDate} (${m.status})`}
                        >
                          <span className={`w-3 h-3 rounded-full border-2 border-white shadow ${STATUS_DOT[m.status]}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> On-track
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> At-risk
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Off-track
          </div>
          {showToday && (
            <div className="flex items-center gap-1.5">
              <span className="w-px h-3 bg-blue-400" /> Today
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
