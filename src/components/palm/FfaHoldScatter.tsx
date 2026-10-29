"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { PalmBatch } from "@/lib/palm-db";

const CATEGORY_COLORS: Record<string, string> = {
  CPO_DEFAULT: "#84cc16",
  BIO_ECO_FRIENDLY: "#3b82f6",
  OTHER_PRODUCTS: "#f97316",
};

const CATEGORY_LABELS: Record<string, string> = {
  CPO_DEFAULT: "CPO Pangan",
  BIO_ECO_FRIENDLY: "Bio / Eco",
  OTHER_PRODUCTS: "Produk Lain",
};

export function FfaHoldScatter({ batches }: { batches: PalmBatch[] }) {
  const series = ["CPO_DEFAULT", "BIO_ECO_FRIENDLY", "OTHER_PRODUCTS"].map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    color: CATEGORY_COLORS[cat],
    points: batches
      .filter((b) => b.category === cat)
      .map((b) => ({
        x: Number(b.lama_penyimpanan_jam),
        y: Number(b.kadar_ffa_percent),
        z: Number(b.berat_ton),
        name: b.batch_id,
      })),
  }));

  return (
    <div className="stat-card-shadow flex flex-col rounded-[1.5rem] bg-white p-5">
      <h3 className="text-base font-bold tracking-tight text-[#1c1d22]">
        Korelasi Hold Time vs Kadar FFA (%)
      </h3>
      <p className="mt-0.5 text-[11px] text-gray-400">
        Semakin lama penyimpanan, semakin tinggi degradasi asam lemak bebas.
      </p>

      <div className="mt-2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#f0f1ed" />
            <XAxis
              type="number"
              dataKey="x"
              name="Hold Time"
              unit=" jam"
              tick={{ fontSize: 10, fill: "#8b8f87" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="FFA"
              unit="%"
              tick={{ fontSize: 10, fill: "#8b8f87" }}
              axisLine={false}
              tickLine={false}
            />
            <ZAxis type="number" dataKey="z" range={[60, 260]} name="Tonase" />
            <ReferenceLine
              x={24}
              stroke="#a3a3a3"
              strokeDasharray="4 4"
              label={{
                value: "Batas pangan 24 jam",
                position: "top",
                fontSize: 9,
                fill: "#a3a3a3",
              }}
            />
            <ReferenceLine
              y={5}
              stroke="#d6d6d6"
              strokeDasharray="4 4"
              label={{ value: "FFA 5%", position: "right", fontSize: 9, fill: "#a3a3a3" }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: unknown, name: unknown) => [String(value), String(name)]}
              labelFormatter={() => ""}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e8eae4",
                boxShadow: "0 4px 16px rgba(28,29,34,0.08)",
                fontSize: 11,
                fontWeight: 600,
                padding: "6px 12px",
              }}
            />
            {series.map((s) => (
              <Scatter
                key={s.category}
                name={s.label}
                data={s.points}
                fill={s.color}
                fillOpacity={0.55}
                stroke={s.color}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-1 flex items-center justify-center gap-5">
        {series.map((s) => (
          <span key={s.category} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
