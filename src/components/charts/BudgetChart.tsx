"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface BudgetChartDatum {
  name: string;
  planned: number;
  spent: number;
}

export default function BudgetChart({ data }: { data: BudgetChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} />
        <YAxis tick={{ fontSize: 12, fill: "#475569" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="planned" name="Planned" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="spent" name="Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
