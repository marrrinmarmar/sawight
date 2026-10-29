"use client";

import { ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { heroSparkline, heroStats } from "@/lib/mock-data";

function MiniSparkline({ data }: { data: number[] }) {
  const points = data.map((value, i) => ({ i, value }));
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#84cc16"
            strokeWidth={1.5}
            fill="url(#heroSpark)"
            dot={false}
            isAnimationActive={false}
          />
          <defs>
            <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3e635" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProductionMiniCard({ data }: { data: number[] }) {
  return (
    <div className="stat-card-shadow flex w-36 flex-col rounded-2xl bg-white p-3">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium leading-tight text-gray-500">
          Energy
          <br />
          Production
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef2e2]">
          <ArrowUpRight className="size-3.5 text-[#84cc16]" strokeWidth={2.4} />
        </span>
      </div>
      <p className="mt-1 text-xl font-bold tracking-tight text-[#1c1d22]">200</p>
      <MiniSparkline data={data} />
    </div>
  );
}

/** Stylized flat vector stand-in for the 3D ecosystem render. */
function EcoScene() {
  return (
    <svg viewBox="0 0 340 220" className="h-full w-full" aria-hidden="true">
      {/* ground blob */}
      <ellipse cx="170" cy="168" rx="150" ry="46" fill="#cdd9c0" opacity={0.55} />
      <ellipse cx="170" cy="164" rx="124" ry="38" fill="#d7e2ca" opacity={0.8} />
      {/* wind turbines */}
      <g stroke="#f4f7f1" strokeWidth={5} strokeLinecap="round">
        <line x1="96" y1="150" x2="96" y2="72" />
        <line x1="126" y1="146" x2="126" y2="88" />
      </g>
      <g fill="#fbfdfa">
        {[0, 120, 240].map((a) => (
          <ellipse
            key={`t1-${a}`}
            cx={96 + 30 * Math.sin((a * Math.PI) / 180)}
            cy={72 - 30 * Math.cos((a * Math.PI) / 180)}
            rx="5"
            ry="15"
            transform={`rotate(${a} ${96 + 30 * Math.sin((a * Math.PI) / 180)} ${72 - 30 * Math.cos((a * Math.PI) / 180)})`}
            opacity={0.95}
          />
        ))}
        {[30, 150, 270].map((a) => (
          <ellipse
            key={`t2-${a}`}
            cx={126 + 21 * Math.sin((a * Math.PI) / 180)}
            cy={88 - 21 * Math.cos((a * Math.PI) / 180)}
            rx="4"
            ry="11"
            transform={`rotate(${a} ${126 + 21 * Math.sin((a * Math.PI) / 180)} ${88 - 21 * Math.cos((a * Math.PI) / 180)})`}
            opacity={0.85}
          />
        ))}
      </g>
      <circle cx="96" cy="66" r="4.5" fill="#84cc16" />
      <circle cx="126" cy="82" r="3.8" fill="#84cc16" />
      {/* solar panels */}
      <g transform="translate(196 118)">
        <path d="M0 26 L44 12 L88 26 L88 44 L44 58 L0 44 Z" fill="#1e2b1f" />
        <path d="M0 26 L44 12 L88 26 L44 40 Z" fill="#354a37" />
        <g stroke="#5d7a5f" strokeWidth="2">
          <line x1="22" y1="19" x2="22" y2="49" />
          <line x1="66" y1="19" x2="66" y2="49" />
          <line x1="0" y1="35" x2="88" y2="35" />
        </g>
      </g>
      {/* building */}
      <g transform="translate(230 96)">
        <path d="M0 42 L34 26 L68 42 L68 70 L34 86 L0 70 Z" fill="#f6f8f4" />
        <path d="M0 42 L34 26 L34 86 L0 70 Z" fill="#e3e8e0" />
        <g fill="#9fb3a1">
          <rect x="10" y="52" width="8" height="9" />
          <rect x="24" y="46" width="8" height="9" />
          <rect x="40" y="46" width="8" height="9" />
          <rect x="54" y="52" width="8" height="9" />
        </g>
        <rect x="15" y="12" width="4" height="16" fill="#f4f7f1" />
        <ellipse cx="17" cy="10" rx="6.5" ry="4.5" fill="#84cc16" />
      </g>
      {/* trees */}
      <g fill="#4d7c4f">
        <circle cx="66" cy="150" r="12" />
        <circle cx="86" cy="162" r="8" />
        <circle cx="52" cy="162" r="7" />
        <circle cx="188" cy="156" r="10" />
        <circle cx="206" cy="164" r="7" />
        <circle cx="176" cy="164" r="6" />
      </g>
      <g fill="#184e2f" opacity={0.35}>
        <ellipse cx="118" cy="170" rx="20" ry="7" />
        <ellipse cx="160" cy="172" rx="14" ry="5" />
      </g>
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-[#dee5da] via-[#e7ebe3] to-[#eef0ea] p-4">
      <div className="grid grid-cols-1 gap-6 items-stretch lg:grid-cols-[auto_1fr_auto]">
        {/* Left: headline + mini metric cards */}
        <div className="flex flex-col justify-between py-2">
          <div>
            <h1 className="max-w-[15rem] text-[2rem] font-extrabold leading-[1.05] tracking-tight text-[#1c1d22]">
              INTELLIGENT ECO SYSTEM
            </h1>
            <p className="mt-2 max-w-[16rem] text-xs text-gray-500">
              Next-gen infrastructure for a sustainable world.
            </p>
          </div>
          <div className="mt-5 flex gap-3">
            <ProductionMiniCard data={heroSparkline.trending} />
            <ProductionMiniCard data={heroSparkline.smooth} />
          </div>
        </div>

        {/* Center: 3D eco scene */}
        <div className="flex items-end justify-center pb-1">
          <div className="h-36 w-full max-w-xs">
            <EcoScene />
          </div>
        </div>

        {/* Right: glassmorphism stat overlay */}
        <div className="flex items-end justify-end pb-2">
          <div className="flex flex-col gap-3">
            {heroStats.map(({ value, label }) => (
              <div
                key={label}
                className="w-40 rounded-2xl bg-white/55 px-4 py-3.5 shadow-sm backdrop-blur-md ring-1 ring-white/60"
              >
                <p className="text-xl font-bold tracking-tight text-[#1c1d22]">{value}</p>
                <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-gray-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
