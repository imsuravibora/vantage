// A small recurring mark for the Vantage brand — a lookout peak with a flag,
// evoking a "vantage point." Uses currentColor so it adapts to its context.
export default function VantageMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 19 L9 8 L12 13 L15 7 L21 19 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M15 7 L15 3.2 L18.5 4.6 L15 6" fill="currentColor" stroke="none" />
    </svg>
  );
}
