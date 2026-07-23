import { randomUUID } from "node:crypto";
import { getSupabase } from "./supabase-admin";
import type { TicketStatus } from "./types";

export interface NewTicketInput {
  projectId: string;
  assigneeId: string;
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

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update ticket: ${error.message}`);
  return data;
}
