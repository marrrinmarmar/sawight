"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { powerEfficiency } from "@/lib/mock-data";

const legend = [
  { label: "Renewable", color: "#a3e635" },
  { label: "Stored", color: "#e4e6e1" },
  { label: "Backup", color: "#1c1d22" },
];

const SEGMENT = {
  stroke: "#ffffff",
  strokeWidth: 3,
  radius: 5,
};

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e8eae4",
  boxShadow: "0 4px 16px rgba(28,29,34,0.08)",
  fontSize: 11,
  fontWeight: 600,
  padding: "6px 12px",
};

const labelFormatter = (name: string) => (value: number | string) => [
  `${value}%`,
  name.charAt(0).toUpperCase() + name.slice(1),
];

export function PowerEfficiencyChart() {
  const data = powerEfficiency.map((d) => ({
    ...d,
    renewableB: d.renewable * 0.8,
    storedB: d.stored * 0.8,
    backupB: d.backup * 0.8,
  }));

  return (
    <div className="stat-card-shadow flex flex-col rounded-[1.5rem] bg-white p-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-[#1c1d22]">Power Efficiency</h3>
        <div className="flex items-center gap-3">
          {legend.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1 text-[9px] text-gray-500">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <ResponsiveContainer width="100%" height={122}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} barGap={3}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#8b8f87", fontWeight: 600 }}
              dy={2}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.02)" }}
              contentStyle={tooltipStyle}
              formatter={(value: unknown, name: unknown) =>
                labelFormatter(String(name))(Number(value))
              }
            />
            {/* Primary stack (larger column): dark base, lime middle, light top */}
            <Bar dataKey="backup" stackId="a" fill="#1c1d22" isAnimationActive={false} {...SEGMENT} />
            <Bar dataKey="renewable" stackId="a" fill="#a3e635" isAnimationActive={false} {...SEGMENT} />
            <Bar dataKey="stored" stackId="a" fill="#e4e6e1" isAnimationActive={false} {...SEGMENT} />
            {/* Secondary stack (smaller column) */}
            <Bar dataKey="backupB" stackId="b" fill="#1c1d22" isAnimationActive={false} {...SEGMENT} />
            <Bar dataKey="renewableB" stackId="b" fill="#a3e635" isAnimationActive={false} {...SEGMENT} />
            <Bar dataKey="storedB" stackId="b" fill="#e4e6e1" isAnimationActive={false} {...SEGMENT} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
