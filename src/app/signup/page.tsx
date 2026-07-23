"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import VantageMark from "@/components/VantageMark";
import type { UserRole } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("project_manager");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (!data.session) {
      // Email confirmation is required before a session exists.
      setConfirmEmailSent(true);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  if (confirmEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm border border-slate-200 rounded-lg bg-white p-6 text-center">
          <h1 className="text-xl font-bold">Check your email</h1>
          <p className="text-sm text-slate-500 mt-2">
            We sent a confirmation link to {email}. Click it, then come back and sign in.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm text-blue-700 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm border border-slate-200 rounded-lg bg-white p-6">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <VantageMark className="w-6 h-6 text-amber-500" />
          Vantage
        </h1>
        <p className="text-sm text-slate-500 mt-1">Create an account</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="project_manager">Project Manager</option>
              <option value="management">Management</option>
            </select>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
