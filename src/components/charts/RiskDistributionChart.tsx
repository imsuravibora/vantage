"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

export interface RiskDistributionDatum {
  name: "low" | "medium" | "high";
  value: number;
}

export default function RiskDistributionChart({ data }: { data: RiskDistributionDatum[] }) {
  const nonZero = data.filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={nonZero} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {nonZero.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
