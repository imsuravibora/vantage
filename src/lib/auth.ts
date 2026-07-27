import { createClient } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase-admin";
import type { Profile, UserRole } from "@/lib/types";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getSupabase();
  const { data, error } = await admin.from("profiles").select("*").eq("id", user.id).single();
  if (error || !data) return null;

  return { id: data.id, email: data.email, fullName: data.full_name, role: data.role };
}

// Throws AuthError (401/403) if not signed in or wrong role. Use in API routes.
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AuthError("Not authenticated", 401);
  if (profile.role !== role) throw new AuthError("Not authorized for this action", 403);
  return profile;
}

// Throws AuthError (401) if not signed in. Use for API routes any logged-in
// user (either role) may call.
export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AuthError("Not authenticated", 401);
  return profile;
}
