import type { HTMLAttributes } from "react";

export default function Card({
  className = "",
  hover = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-slate-200/70 bg-white shadow-card ${
        hover ? "transition-shadow duration-200 hover:shadow-card-hover" : ""
      } ${className}`}
      {...props}
    />
  );
}
