import { getSupabase } from "./supabase-admin";

export interface ProjectManagerOption {
  id: string;
  fullName: string | null;
  email: string;
}

export interface AssignmentRow {
  id: number;
  profileId: string;
  profileName: string;
  projectId: string;
  projectName: string;
  assignedAt: string;
}

export async function listProjectManagers(): Promise<ProjectManagerOption[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "project_manager")
    .order("full_name", { ascending: true });
  if (error) throw new Error(`Failed to list project managers: ${error.message}`);
  return (data ?? []).map((p) => ({ id: p.id, fullName: p.full_name, email: p.email }));
}

export async function listAssignments(): Promise<AssignmentRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("project_assignments")
    .select("*, profiles(full_name, email), projects(name)")
    .order("assigned_at", { ascending: false });
  if (error) throw new Error(`Failed to list project assignments: ${error.message}`);

  return (data ?? []).map((row) => {
    const joined = row as unknown as {
      profiles: { full_name: string | null; email: string } | null;
      projects: { name: string } | null;
    };
    return {
      id: row.id,
      profileId: row.profile_id,
      profileName: joined.profiles?.full_name ?? joined.profiles?.email ?? row.profile_id,
      projectId: row.project_id,
      projectName: joined.projects?.name ?? row.project_id,
      assignedAt: row.assigned_at,
    };
  });
}

export async function listAssignedProjectIds(profileId: string): Promise<string[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("project_assignments")
    .select("project_id")
    .eq("profile_id", profileId);
  if (error) throw new Error(`Failed to list assigned projects: ${error.message}`);
  return (data ?? []).map((row) => row.project_id);
}

export async function assignPmToProject(profileId: string, projectId: string): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("project_assignments")
    .insert({ profile_id: profileId, project_id: projectId })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("This person is already assigned to that project.");
    throw new Error(`Failed to assign: ${error.message}`);
  }
  return data.id;
}

export async function unassignPmFromProject(assignmentId: number) {
  const supabase = getSupabase();
  const { error } = await supabase.from("project_assignments").delete().eq("id", assignmentId);
  if (error) throw new Error(`Failed to remove assignment: ${error.message}`);
}
