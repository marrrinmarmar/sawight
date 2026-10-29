"use client";

import { ChevronRight } from "lucide-react";

/** Simplified vector world map, dark forest-green style. */
function PollutionMap() {
  return (
    <svg viewBox="0 0 220 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d5c42" />
          <stop offset="100%" stopColor="#2b4430" />
        </linearGradient>
      </defs>
      <rect width="220" height="150" rx="16" fill="url(#mapBg)" />

      {/* faint meridians */}
      <g stroke="#ffffff" strokeWidth="0.4" opacity={0.08}>
        <path d="M0 40 H220 M0 80 H220 M0 120 H220" />
        <path d="M55 0 V150 M110 0 V150 M165 0 V150" />
      </g>

      {/* stylized continents */}
      <g fill="#26352a" opacity={0.85}>
        <path d="M28 34 q14 -14 34 -8 q10 4 8 14 q-2 10 -14 12 q-4 8 -12 8 q-14 0 -18 -10 q-3 -9 2 -16 Z" />
        <path d="M46 82 q10 -4 14 4 q6 10 0 22 q-4 10 -10 12 q-6 -2 -8 -14 q-2 -14 4 -24 Z" />
        <path d="M118 22 q16 -8 28 2 q8 6 4 14 q-4 10 -18 8 q-14 -2 -18 -10 q-2 -8 4 -14 Z" />
        <path d="M132 66 q12 -4 20 4 q10 10 6 24 q-4 14 -16 14 q-10 0 -14 -12 q-4 -18 4 -30 Z" />
        <path d="M178 52 q14 -6 24 4 q6 8 2 18 q-6 10 -18 8 q-10 -2 -12 -12 q-2 -12 4 -18 Z" />
        <path d="M104 132 q10 -4 16 2 q4 6 -2 10 q-8 4 -14 0 q-4 -6 0 -12 Z" />
      </g>

      {/* subtle dot texture */}
      <g fill="#a3e635" opacity={0.25}>
        {[
          [70, 60],
          [90, 96],
          [126, 44],
          [142, 100],
          [186, 66],
          [58, 118],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />
        ))}
      </g>

      {/* location badge */}
      <g transform="translate(110 72)">
        <rect x="-38" y="-14" width="96" height="26" rx="13" fill="#101511" opacity={0.88} />
        <circle cx="-27" cy="-1" r="3" fill="#a3e635" />
        <text x="-19" y="2" fontSize="7.5" fontWeight="600" fill="#ffffff" letterSpacing="0.4">
          Central Africa
        </text>
        <text x="42" y="2" fontSize="7.5" fontWeight="700" fill="#a3e635">
          82%
        </text>
      </g>
    </svg>
  );
}

export function GlobalPollutionCard() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-[#1c1d22]">Global Pollution</h3>
        <button
          type="button"
          className="flex items-center gap-0.5 rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-gray-600 shadow-sm ring-1 ring-black/5"
        >
          Europe
          <ChevronRight className="size-3 text-gray-400" />
        </button>
      </div>
      <div className="mt-2 h-44 overflow-hidden rounded-3xl">
        <PollutionMap />
      </div>
    </div>
  );
}
