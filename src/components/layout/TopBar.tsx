"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, ChevronDown, UserCircle2 } from "lucide-react";
import { useUserRole, ROLE_CONFIGS, type RoleType } from "@/lib/user-role-context";

const moduleNames: Record<string, string> = {
  "/": "Overview Terpusat",
  "/pengelola": "1. Pengelola (Ekstraksi Cair & Auto Batch)",
  "/lab": "2. Laboratorium (Uji Mutu & COA)",
  "/gudang": "3. Gudang & Distribusi (FIFO)",
  "/simulator": "Simulator Terintegrasi",
  "/batches": "Seluruh Inventaris",
  "/settings": "Settings",
};

export function TopBar() {
  const pathname = usePathname();
  const { role, switchRole, currentRoleConfig } = useUserRole();
  const moduleName = moduleNames[pathname] ?? "Dashboard";

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-400">
          PalmQual-AI <span className="text-gray-300">/</span>{" "}
          <span className="font-semibold text-gray-700">{moduleName}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Switch User Dropdown Chip */}
        <div className="relative">
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm transition-all hover:border-gray-300">
            <span
              className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${currentRoleConfig.avatarBg}`}
            >
              {currentRoleConfig.avatarText}
            </span>
            <span className="text-xs font-bold text-gray-700 max-w-[100px] truncate sm:max-w-none">
              {currentRoleConfig.name}
            </span>
            <select
              aria-label="Pilih Divisi Pengguna"
              value={role}
              onChange={(e) => switchRole(e.target.value as RoleType)}
              className="cursor-pointer rounded-lg bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 outline-none hover:bg-gray-100"
            >
              {(Object.keys(ROLE_CONFIGS) as RoleType[]).map((rKey) => (
                <option key={rKey} value={rKey}>
                  {ROLE_CONFIGS[rKey].name} ({rKey === "all" ? "Admin" : rKey.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative hidden md:block w-56">
          <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Cari batch..."
            className="h-9 w-full rounded-full border border-black/5 bg-white pl-9 pr-3 text-xs text-gray-700 shadow-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#a3e635]/50"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-colors hover:bg-gray-50"
        >
          <Bell className="size-3.5 text-gray-600" strokeWidth={2} />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#84cc16] ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
