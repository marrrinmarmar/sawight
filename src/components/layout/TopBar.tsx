"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";

const moduleNames: Record<string, string> = {
  "/": "Dashboard",
  "/simulator": "Simulator",
  "/batches": "Inventaris",
  "/settings": "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const moduleName = moduleNames[pathname] ?? "Dashboard";

  return (
    <header className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-400">
        PalmQual-AI <span className="text-gray-300">/</span>{" "}
        <span className="font-semibold text-gray-600">{moduleName}</span>
      </span>
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Cari batch / kebun..."
            className="h-10 w-full rounded-full border border-black/5 bg-white pl-10 pr-4 text-sm text-gray-700 shadow-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#a3e635]/50"
          />
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50"
        >
          <Bell className="size-4 text-gray-600" strokeWidth={2} />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-[#84cc16] ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
