"use client";

import { Cloud, Droplets, Zap } from "lucide-react";
import { kpis } from "@/lib/mock-data";

const icons = {
  cloud: Cloud,
  zap: Zap,
  droplets: Droplets,
};

export function KpiCards() {
  return (
    <section className="grid grid-cols-3 gap-4">
      {kpis.map(({ id, value, unit, label, trend, icon }) => {
        const Icon = icons[icon];
        return (
          <div
            key={id}
            className="stat-card-shadow flex items-center gap-4 rounded-[1.5rem] bg-white px-5 py-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2f4ef]">
              <Icon
                className={
                  icon === "cloud"
                    ? "size-5 text-gray-500"
                    : icon === "zap"
                      ? "size-5 text-gray-500"
                      : "size-5 text-gray-500"
                }
                strokeWidth={1.9}
              />
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight text-[#1c1d22]">{value}</span>
                <span className="rounded-md bg-[#eef2e2] px-1.5 py-0.5 text-[9px] font-bold text-[#65a30d]">
                  {trend}
                </span>
                <span className="text-[10px] font-semibold text-gray-400">{unit}</span>
              </div>
              <p className="truncate text-[11px] text-gray-500">{label}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
