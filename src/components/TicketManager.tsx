"use client";

import { useState } from "react";
import Badge from "@/components/Badge";
import type { Ticket, TicketStatus } from "@/lib/types";

const STATUS_OPTIONS: TicketStatus[] = ["todo", "in-progress", "done", "blocked"];

export default function TicketManager({
  projectId,
  initialTickets,
  engineers,
  canEdit,
}: {
  projectId: string;
  initialTickets: (Ticket & { assigneeName: string })[];
  engineers: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState(engineers[0]?.id ?? "");
  const [storyPoints, setStoryPoints] = useState(3);
  const [sprint, setSprint] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, assigneeId, title: title.trim(), storyPoints, sprint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create ticket");
      const assigneeName = engineers.find((e) => e.id === assigneeId)?.name ?? assigneeId;
      setTickets((prev) => [
        {
          id: data.ticket.id,
          projectId: data.ticket.project_id,
          assigneeId: data.ticket.assignee_id,
          title: data.ticket.title,
          status: data.ticket.status,
          storyPoints: data.ticket.story_points,
          sprint: data.ticket.sprint,
          createdAt: data.ticket.created_at,
          updatedAt: data.ticket.updated_at,
          assigneeName,
        },
        ...prev,
      ]);
      setTitle("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

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

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <h3 className="font-semibold">Tickets</h3>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      <ul className="mt-3 space-y-2 text-sm max-h-72 overflow-y-auto">
        {tickets.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
            <div className="min-w-0">
              <div className="truncate">{t.title}</div>
              <div className="text-xs text-slate-400">
                {t.assigneeName} · {t.storyPoints}pt · Sprint {t.sprint}
              </div>
            </div>
            {canEdit ? (
              <select
                value={t.status}
                onChange={(e) => handleStatusChange(t.id, e.target.value as TicketStatus)}
                disabled={busyId === t.id}
                className="rounded-md border border-slate-300 px-1.5 py-1 text-xs"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <Badge value={t.status} />
            )}
          </li>
        ))}
        {tickets.length === 0 && <li className="text-slate-400">No tickets yet</li>}
      </ul>

      {canEdit && (
        <form onSubmit={handleCreate} className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New ticket title"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            >
              {engineers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={storyPoints}
              onChange={(e) => setStoryPoints(Number(e.target.value))}
              className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
              title="Story points"
            />
            <input
              type="number"
              min={1}
              value={sprint}
              onChange={(e) => setSprint(Number(e.target.value))}
              className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
              title="Sprint"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {creating ? "Adding..." : "Add ticket"}
          </button>
        </form>
      )}
    </div>
  );
}
