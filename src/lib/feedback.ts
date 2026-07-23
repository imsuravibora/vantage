import { getSupabase } from "./supabase-admin";

export interface FeedbackRow {
  id: number;
  report_id: number;
  author_id: string;
  author_name: string;
  comment: string;
  created_at: string;
}

export async function listFeedbackForReports(reportIds: number[]): Promise<FeedbackRow[]> {
  if (reportIds.length === 0) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("report_feedback")
    .select("*")
    .in("report_id", reportIds)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to list feedback: ${error.message}`);
  return (data ?? []) as FeedbackRow[];
}

export async function addFeedback(
  reportId: number,
  authorId: string,
  authorName: string,
  comment: string
): Promise<FeedbackRow> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("report_feedback")
    .insert({ report_id: reportId, author_id: authorId, author_name: authorName, comment })
    .select()
    .single();
  if (error) throw new Error(`Failed to add feedback: ${error.message}`);
  return data as FeedbackRow;
}
