"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Sparkles, Gauge, CalendarRange, FileText, ClipboardList, UserCog, ListChecks, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import VantageMark from "@/components/VantageMark";
import type { Profile } from "@/lib/types";

const BASE_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ask", label: "Ask AI", icon: Sparkles },
  { href: "/timeline", label: "Timeline", icon: CalendarRange },
];

const ROLE_LABEL: Record<Profile["role"], string> = {
  project_manager: "Project Manager",
  management: "Management",
  engineer: "Engineer",
};

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [...BASE_NAV_ITEMS];
  if (profile.role === "engineer") {
    navItems.push({ href: "/my-work", label: "My Work", icon: ListChecks });
  } else {
    navItems.splice(2, 0, { href: "/capacity", label: "Capacity", icon: Gauge });
    navItems.push({ href: "/reports", label: "Reports", icon: ClipboardList });
    if (profile.role === "management") {
      navItems.push({ href: "/assignments", label: "Assignments", icon: UserCog });
    } else {
      navItems.push({ href: "/documents", label: "Documents", icon: FileText });
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const initial = (profile.fullName ?? profile.email).trim().charAt(0).toUpperCase();

  return (
    <aside className="w-64 shrink-0 bg-slate-950 text-slate-300 flex flex-col h-screen sticky top-0 overflow-y-auto border-r border-slate-900">
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/25">
            <VantageMark className="w-5 h-5 text-brand-400" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Vantage</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1.5 tracking-wide uppercase">AI Management Reporting</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active ? "text-brand-400" : "text-slate-500 group-hover:text-brand-400"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-200 ring-1 ring-white/10">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{profile.fullName ?? profile.email}</div>
            <div className="text-xs text-slate-500">{ROLE_LABEL[profile.role]}</div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="shrink-0 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
