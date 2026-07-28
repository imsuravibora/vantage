import type { ReactNode } from "react";
import { Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import VantageMark from "@/components/VantageMark";

const FEATURES = [
  { icon: Sparkles, text: "Ask AI answers grounded in real documents, with citations" },
  { icon: ShieldCheck, text: "The Sentinel reviews every upload for hidden risk, in the background" },
  { icon: CheckCircle2, text: "Every AI-drafted report needs a human's approval before it's official" },
];

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/25">
        <VantageMark className="w-5 h-5 text-brand-400" />
      </div>
      <span className="text-lg font-semibold tracking-tight text-white">Vantage</span>
    </div>
  );
}

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 30% 0%, rgb(245 158 11 / 0.16), transparent)",
          }}
        />
        <BrandMark className="relative" />
        <div className="relative">
          <h2 className="text-3xl font-semibold leading-tight text-white text-balance">
            AI-native management reporting, with a human always in the loop.
          </h2>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-slate-300">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-slate-500">Built for project management &amp; AI operations</div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 ring-1 ring-brand-200">
              <VantageMark className="w-5 h-5 text-brand-600" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">Vantage</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
