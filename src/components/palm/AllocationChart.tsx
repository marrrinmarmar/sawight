"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PalmStats } from "@/lib/palm-db";

const COLORS = {
  cpo: "#84cc16",
  bio: "#3b82f6",
  other: "#f97316",
};

export function AllocationChart({ stats }: { stats: PalmStats | null }) {
  const data = useMemo(
    () =>
      stats
        ? [
            { name: "CPO Pangan (DEFAULT)", value: stats.distribution.cpo_default, key: "cpo" },
            {
              name: "Bio / Eco-Friendly",
              value: stats.distribution.bio_eco_friendly,
              key: "bio",
            },
            { name: "Produk Lainnya", value: stats.distribution.other_products, key: "other" },
          ].filter((d) => d.value > 0)
        : [],
    [stats]
  );

  return (
    <div className="stat-card-shadow flex flex-col rounded-[1.5rem] bg-white p-5">
      <h3 className="text-base font-bold tracking-tight text-[#1c1d22]">
        Proporsi Alokasi Hasil Panen
      </h3>
      <p className="mt-0.5 text-[11px] text-gray-400">
        Sebaran kategori alokasi seluruh lot yang terdaftar.
      </p>

      <div className="mt-2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.length ? data : [{ name: "Belum ada data", value: 1, key: "cpo" }]}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="85%"
              paddingAngle={3}
              stroke="#fff"
              strokeWidth={3}
              isAnimationActive={false}
            >
              {(data.length ? data : [{ key: "cpo" }]).map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.key === "bio"
                      ? COLORS.bio
                      : entry.key === "other"
                        ? COLORS.other
                        : COLORS.cpo
                  }
                  opacity={data.length ? 1 : 0.1}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown, name: unknown) => [`${value} lot`, String(name)]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e8eae4",
                boxShadow: "0 4px 16px rgba(28,29,34,0.08)",
                fontSize: 11,
                fontWeight: 600,
                padding: "6px 12px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-[11px] text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
