"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/AuthShell";
import Button from "@/components/Button";
import { INPUT_CLASS, LABEL_CLASS } from "@/lib/ui";
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
      <AuthShell>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-200">
          <MailCheck className="h-5 w-5 text-brand-600" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mt-4">Check your email</h1>
        <p className="text-sm text-slate-500 mt-2">
          We sent a confirmation link to <span className="font-medium text-slate-700">{email}</span>. Click it, then
          come back and sign in.
        </p>
        <Link href="/login" className="mt-5 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold text-slate-900">Create an account</h1>
      <p className="text-sm text-slate-500 mt-1">Choose your role to get started</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className={LABEL_CLASS}>Full name</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={INPUT_CLASS}>
            <option value="project_manager">Project Manager</option>
            <option value="management">Management</option>
          </select>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Sign up"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
