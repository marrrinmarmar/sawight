"use client";

import { Boxes, FlaskConical, Timer, Weight } from "lucide-react";
import type { PalmStats } from "@/lib/palm-db";

export function PalmKpiCards({ stats }: { stats: PalmStats | null }) {
  const kpis = [
    {
      icon: Boxes,
      label: "Total Batch Terdaftar",
      value: (stats?.total_batches ?? 0).toLocaleString("id-ID"),
      unit: "lot",
    },
    {
      icon: Weight,
      label: "Total Tonase Panen",
      value: (stats?.total_tonnage ?? 0).toLocaleString("id-ID"),
      unit: "ton",
    },
    {
      icon: FlaskConical,
      label: "Rata-rata Kadar FFA",
      value: (stats?.avg_ffa ?? 0).toFixed(2),
      unit: "%",
    },
    {
      icon: Timer,
      label: "Rata-rata Hold Time",
      value: (stats?.avg_hold_time ?? 0).toFixed(1),
      unit: "jam",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map(({ icon: Icon, label, value, unit }) => (
        <div
          key={label}
          className="stat-card-shadow flex items-center gap-4 rounded-[1.5rem] bg-white px-5 py-4"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2f4ef]">
            <Icon className="size-5 text-[#65a30d]" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#1c1d22]">{value}</span>
              <span className="text-[10px] font-semibold text-gray-400">{unit}</span>
            </div>
            <p className="truncate text-[11px] text-gray-500">{label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
