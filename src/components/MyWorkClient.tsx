"use client";

import { useState } from "react";
import { ListChecks, Inbox } from "lucide-react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import type { Ticket, TicketStatus } from "@/lib/types";

const STATUS_OPTIONS: TicketStatus[] = ["todo", "in-progress", "done", "blocked"];

type MyTicket = Ticket & { projectName: string };

export default function MyWorkClient({
  engineerName,
  tickets: initialTickets,
  openTickets: initialOpenTickets,
}: {
  engineerName: string;
  tickets: MyTicket[];
  openTickets: MyTicket[];
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [openTickets, setOpenTickets] = useState(initialOpenTickets);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: TicketStatus) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update ticket");
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: data.ticket.status } : t)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleClaim(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${id}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to claim ticket");
      const claimed = openTickets.find((t) => t.id === id);
      if (claimed) {
        setOpenTickets((prev) => prev.filter((t) => t.id !== id));
        setTickets((prev) => [{ ...claimed, status: data.ticket.status }, ...prev]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome, {engineerName}</h1>
      <p className="text-slate-500 mt-1">Your tickets, and work anyone can pick up.</p>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      <Card className="mt-6 p-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <ListChecks className="h-4 w-4 text-slate-400" />
          My tickets
        </h3>

        <ul className="mt-3 space-y-2 text-sm">
          {tickets.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
              <div className="min-w-0">
                <div className="truncate text-slate-700">{t.title}</div>
                <div className="text-xs text-slate-400">
                  {t.projectName} · {t.storyPoints}pt · Sprint {t.sprint}
                </div>
              </div>
              <select
                value={t.status}
                onChange={(e) => handleStatusChange(t.id, e.target.value as TicketStatus)}
                disabled={busyId === t.id}
                className="rounded-lg border border-slate-300 px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400/60"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </li>
          ))}
          {tickets.length === 0 && <li className="text-slate-400">Nothing assigned to you right now.</li>}
        </ul>
      </Card>

      <Card className="mt-6 p-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Inbox className="h-4 w-4 text-slate-400" />
          Open tickets
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Unassigned work from any project — claim anything you can help with.</p>

        <ul className="mt-3 space-y-2 text-sm">
          {openTickets.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
              <div className="min-w-0">
                <div className="truncate text-slate-700">{t.title}</div>
                <div className="text-xs text-slate-400">
                  {t.projectName} · {t.storyPoints}pt · Sprint {t.sprint}
                </div>
              </div>
              <Button size="sm" variant="secondary" disabled={busyId === t.id} onClick={() => handleClaim(t.id)}>
                Claim
              </Button>
            </li>
          ))}
          {openTickets.length === 0 && <li className="text-slate-400">Nothing open right now — the pool's empty.</li>}
        </ul>
      </Card>
    </div>
  );
}
