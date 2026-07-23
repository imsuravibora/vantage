"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS: Record<string, string> = {
  overloaded: "#ef4444",
  balanced: "#10b981",
  underloaded: "#f59e0b",
};

export interface CapacityChartDatum {
  name: string;
  utilizationPct: number;
  status: "overloaded" | "balanced" | "underloaded";
}

export default function CapacityChart({ data }: { data: CapacityChartDatum[] }) {
  const sorted = [...data].sort((a, b) => b.utilizationPct - a.utilizationPct);

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, sorted.length * 32)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#475569" }} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "#475569" }} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Bar dataKey="utilizationPct" radius={[0, 4, 4, 0]}>
          {sorted.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.status]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
