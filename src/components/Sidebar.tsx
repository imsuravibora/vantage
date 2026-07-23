"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const BASE_NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/ask", label: "Ask AI" },
  { href: "/capacity", label: "Capacity" },
  { href: "/timeline", label: "Timeline" },
];

const ROLE_LABEL: Record<Profile["role"], string> = {
  project_manager: "Project Manager",
  management: "Management",
};

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [...BASE_NAV_ITEMS];
  if (profile.role === "management") {
    navItems.push({ href: "/reports", label: "Reports" });
  } else {
    navItems.push({ href: "/documents", label: "Documents" });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col min-h-screen">
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="text-xl font-bold text-white">Vantage</div>
        <div className="text-xs text-slate-400 mt-1">AI Management Reporting</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-slate-800">
        <div className="text-sm font-medium text-white truncate">{profile.fullName ?? profile.email}</div>
        <div className="text-xs text-slate-400">{ROLE_LABEL[profile.role]}</div>
        <button
          onClick={handleSignOut}
          className="mt-3 text-xs text-slate-400 hover:text-white underline"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
