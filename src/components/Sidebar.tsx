"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/ask", label: "Ask AI" },
  { href: "/reports", label: "Reports" },
  { href: "/capacity", label: "Capacity" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col min-h-screen">
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="text-xl font-bold text-white">
          Vantage
        </div>
        <div className="text-xs text-slate-400 mt-1">AI Management Reporting</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
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
      <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-500">
        Synthetic demo data
      </div>
    </aside>
  );
}
