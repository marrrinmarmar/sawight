"use client";

import { Switch } from "@/components/ui/switch";

const pointers = [
  { label: "Solar Array", pos: "left-0 top-2" },
  { label: "Wind Farm", pos: "left-2 bottom-0" },
  { label: "Smart Grid", pos: "right-0 top-8" },
];

/** Small stylized island stand-in for the 3D asset render. */
function AssetScene() {
  return (
    <svg viewBox="0 0 180 110" className="h-14 w-24" aria-hidden="true">
      <ellipse cx="90" cy="74" rx="60" ry="24" fill="#dfe7d8" />
      <ellipse cx="90" cy="70" rx="47" ry="18" fill="#cfe0c4" />
      {/* mini turbines */}
      <g stroke="#fbfdfa" strokeWidth={3} strokeLinecap="round">
        <line x1="117" y1="70" x2="117" y2="38" />
      </g>
      <g fill="#84cc16">
        {[40, 160, 280].map((a) => (
          <ellipse
            key={a}
            cx={117 + 11 * Math.sin((a * Math.PI) / 180)}
            cy={38 - 11 * Math.cos((a * Math.PI) / 180)}
            rx="2"
            ry="6.5"
          />
        ))}
      </g>
      {/* solar panels */}
      <g transform="translate(26 56)">
        <path d="M0 12 L22 4 L44 12 L44 21 L22 29 L0 21 Z" fill="#1e2b1f" />
        <path d="M0 12 L22 4 L44 12 L22 19 Z" fill="#3d5440" />
      </g>
      {/* trees */}
      <g fill="#4d7c4f">
        <circle cx="140" cy="72" r="8" />
        <circle cx="132" cy="80" r="5" />
        <circle cx="74" cy="80" r="6" />
        <circle cx="66" cy="86" r="4" />
      </g>
      {/* dashed pointers */}
      <g stroke="#b9beb2" strokeWidth="1.2" strokeDasharray="3 3" fill="none">
        <path d="M36 22 L44 48 L30 54" />
        <path d="M40 96 L52 82" />
        <path d="M140 55 L132 64" />
      </g>
    </svg>
  );
}

export function AssetHealthCard() {
  return (
    <div className="stat-card-shadow flex flex-col rounded-[1.5rem] bg-white p-3">
      <h3 className="text-sm font-bold tracking-tight text-[#1c1d22]">Asset Health</h3>

      <div className="relative mt-2 flex h-28 items-center justify-center">
        {pointers.map(({ label, pos }) => (
          <span
            key={label}
            className={`absolute ${pos} rounded-lg bg-white px-2 py-1 text-[9px] font-semibold text-gray-600 shadow-sm ring-1 ring-black/5`}
          >
            {label}
          </span>
        ))}
        <AssetScene />
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="text-[10px] font-medium text-gray-400">Status:</span>
        <span className="text-[11px] font-bold text-[#1c1d22]">Active</span>
        <Switch defaultChecked className="data-[state=checked]:bg-[#84cc16] scale-75" />
      </div>
    </div>
  );
}
