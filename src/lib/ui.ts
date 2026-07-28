// Shared class strings so every raw input/select/textarea across the app looks consistent
// without wrapping native form elements (which would complicate refs/controlled props).
export const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400";

export const LABEL_CLASS = "block text-xs font-medium text-slate-500 mb-1.5";
