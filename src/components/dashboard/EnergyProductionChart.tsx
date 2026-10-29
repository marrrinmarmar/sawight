"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MAX_PRODUCTION, energyProduction, statusColors, statusLabels } from "@/lib/mock-data";

type ShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: (typeof energyProduction)[number];
};

/** Thin vertical stem + colored status dot at the tip. */
function LollipopShape({ x, y, width, height, payload }: ShapeProps) {
  if (x === undefined || y === undefined || width === undefined || height === undefined)
    return null;
  // The active day has its own glowing capsule — skip the plain stem there.
  if (payload?.day === "We") return null;
  const cx = x + width / 2;
  const color = statusColors[payload?.status ?? "free"];
  return (
    <g>
      <rect x={cx - 1} y={y} width={2} height={Math.max(height, 0)} fill="#d8dad3" opacity={0.9} />
      <circle cx={cx} cy={y} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

/** Wide glowing lime capsule behind the active day. */
function ActiveColumnShape({ x, y, width, height }: ShapeProps) {
  if (x === undefined || y === undefined || width === undefined || height === undefined)
    return null;
  const cx = x + width / 2;
  return (
    <g>
      <rect
        x={cx - 14}
        y={y}
        width={28}
        height={Math.max(height, 0)}
        rx={14}
        fill="url(#activeGlow)"
      />
      <rect
        x={cx - 14}
        y={Math.max(y, 40)}
        width={28}
        height={Math.max(height - (Math.max(y, 40) - y), 0)}
        rx={14}
        fill="#a3e635"
        opacity={0.9}
      />
    </g>
  );
}

/** Floating pill badge above the active column. */
function ActiveValueLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  value?: number | string;
}) {
  const { x, y, width, value } = props;
  if (x === undefined || y === undefined || width === undefined || !value) return null;
  const cx = x + width / 2;
  return (
    <g transform={`translate(${cx} ${Math.max(y - 30, 6)})`}>
      <rect x={-24} y={0} width={48} height={24} rx={12} fill="#fff" stroke="#e8eae4" />
      <text
        x={0}
        y={16}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fill="#1c1d22"
      >
        {value?.toLocaleString("en-US") ?? ""}
      </text>
    </g>
  );
}

export function EnergyProductionChart() {
  const data = energyProduction.map((d) => ({
    ...d,
    highlight: d.day === "We" ? d.value : 0,
  }));

  return (
    <div className="stat-card-shadow flex flex-col rounded-[1.5rem] bg-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#1c1d22]">Energy Production</h2>
          <p className="mt-0.5 max-w-[16rem] text-[11px] leading-relaxed text-gray-400">
            Weekly overview of renewable energy generated across all fleets.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-full bg-[#f2f4ef] px-3.5 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-[#e8ebe3]"
        >
          Week
          <ChevronRight className="size-3 text-gray-400" />
        </button>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6">
        {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((key) => (
          <span key={key} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: statusColors[key] }}
            />
            {statusLabels[key]}
            <ChevronDown className="size-3 text-gray-300" />
          </span>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-2 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 34, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="activeGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a3e635" stopOpacity={0.15} />
                <stop offset="55%" stopColor="#a3e635" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#a3e635" stopOpacity={0.95} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f0f1ed" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#8b8f87", fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              domain={[0, MAX_PRODUCTION]}
              axisLine={false}
              tickLine={false}
              width={28}
              tick={{ fontSize: 9, fill: "#c2c5bd" }}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                borderRadius: "9999px",
                border: "1px solid #e8eae4",
                boxShadow: "0 4px 16px rgba(28,29,34,0.08)",
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 12px",
              }}
              formatter={(value: unknown) => [
                `${Number(value).toLocaleString("en-US")} kWh`,
              ]}
            />
            {/* Active day capsule */}
            <Bar
              dataKey="highlight"
              barSize={28}
              shape={<ActiveColumnShape />}
              isAnimationActive={false}
            >
              <LabelList dataKey="highlight" content={<ActiveValueLabel />} />
            </Bar>
            {/* Lollipop stems */}
            <Bar
              dataKey="value"
              barSize={28}
              shape={<LollipopShape />}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
