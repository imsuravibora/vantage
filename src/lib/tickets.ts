import { randomUUID } from "node:crypto";
import { getSupabase } from "./supabase-admin";
import { flagBlockedTicket } from "./sentinel";
import type { TicketStatus } from "./types";

export interface NewTicketInput {
  projectId: string;
  assigneeId: string | null;
  title: string;
  storyPoints: number;
  sprint: number;
}

export async function createTicket(input: NewTicketInput) {
  const supabase = getSupabase();
  const id = `tix_${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      id,
      project_id: input.projectId,
      assignee_id: input.assigneeId,
      title: input.title,
      status: "todo",
      story_points: input.storyPoints,
      sprint: input.sprint,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create ticket: ${error.message}`);
  return data;
}

// An engineer picking up an open ticket from the unassigned pool -- only
// succeeds while nobody has claimed it yet, never takes it from a teammate.
export async function claimTicket(id: string, engineerId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tickets")
    .update({ assignee_id: engineerId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("assignee_id", null)
    .select()
    .single();

  if (error || !data) throw new Error("That ticket has already been claimed by someone else.");
  return data;
}

export async function getEngineerIdForProfile(profileId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("engineers").select("id").eq("profile_id", profileId).maybeSingle();
  if (error) throw new Error(`Failed to look up engineer: ${error.message}`);
  return data?.id ?? null;
}

export async function getTicketAssignee(id: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("tickets").select("assignee_id").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to look up ticket: ${error.message}`);
  return data?.assignee_id ?? null;
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update ticket: ${error.message}`);

  // Fire-and-forget: the Sentinel watches for this in the background, it
  // never delays the actual status update from returning to the caller.
  if (status === "blocked") {
    flagBlockedTicket(data.id, data.project_id, data.title).catch((err) =>
      console.error("[sentinel] flagBlockedTicket failed:", err)
    );
  }

  return data;
}
