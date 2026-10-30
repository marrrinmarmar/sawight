"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Atom,
  LayoutGrid,
  FlaskConical,
  Boxes,
  Settings,
  LogOut,
  Factory,
  Warehouse,
  Check,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserRole, ROLE_CONFIGS, type RoleType } from "@/lib/user-role-context";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}

const allNavItems: NavItem[] = [
  { href: "/", icon: LayoutGrid, label: "Overview" },
  { href: "/pengelola", icon: Factory, label: "Pengelola (Cair & ID)" },
  { href: "/lab", icon: FlaskConical, label: "Lab (Uji Mutu)" },
  { href: "/gudang", icon: Warehouse, label: "Gudang (Surat & FIFO)" },
  { href: "/batches", icon: Boxes, label: "Semua Batch" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, currentRoleConfig, switchRole } = useUserRole();
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Filter navigasi berdasarkan role yang sedang aktif
  const visibleNavItems = allNavItems.filter((item) =>
    currentRoleConfig.allowedPaths.includes(item.href)
  );

  return (
    <>
      <aside className="sticky top-0 z-20 flex h-screen w-20 shrink-0 flex-col items-center rounded-r-[1.75rem] bg-[#1c1d22] py-6 shadow-xl">
        {/* Logo */}
        <Link
          href={currentRoleConfig.defaultPath}
          aria-label="PalmQual-AI — kembali"
          className="flex h-10 w-10 items-center justify-center transition-transform hover:scale-110"
        >
          <Atom className="size-8 text-[#84cc16]" strokeWidth={1.75} />
        </Link>

        {/* Navigation */}
        <nav className="mt-12 flex flex-col items-center gap-2">
          {visibleNavItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className={
                  active
                    ? "group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#84cc16] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10"
                    : "group relative flex h-11 w-11 items-center justify-center rounded-2xl text-[#9ba0a8] transition-colors hover:bg-white/5 hover:text-white"
                }
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {/* Hover tooltip */}
                <span className="pointer-events-none absolute left-14 z-30 whitespace-nowrap rounded-lg bg-[#1c1d22] px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg ring-1 ring-white/10 opacity-0 transition-opacity group-hover:opacity-100">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Tombol Switch User / Logout */}
        <button
          type="button"
          onClick={() => setShowRoleModal(true)}
          aria-label="Ganti Role User"
          title="Ganti Divisi / Role User"
          className="group relative flex h-11 w-11 items-center justify-center rounded-2xl text-[#9ba0a8] transition-colors hover:bg-white/5 hover:text-[#84cc16]"
        >
          <LogOut className="size-5" strokeWidth={1.8} />
          <span className="pointer-events-none absolute left-14 z-30 whitespace-nowrap rounded-lg bg-[#1c1d22] px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg ring-1 ring-white/10 opacity-0 transition-opacity group-hover:opacity-100">
            Switch Divisi
          </span>
        </button>

        {/* User avatar dengan badge aktif */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowRoleModal(true)}
            title={`Role aktif: ${currentRoleConfig.name} (${currentRoleConfig.roleTitle})`}
            className="group relative focus:outline-none"
          >
            <Avatar className="size-10 ring-2 ring-white/20 transition-transform group-hover:scale-105">
              <AvatarFallback className={`text-[12px] font-extrabold ${currentRoleConfig.avatarBg}`}>
                {currentRoleConfig.avatarText}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 size-3 rounded-full bg-[#84cc16] ring-2 ring-[#1c1d22]" />
          </button>
        </div>
      </aside>

      {/* Modal Switch User Dialog */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="size-5 text-[#84cc16]" />
                <h3 className="text-base font-bold text-[#1c1d22]">Simulasi Switch Role User</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
              >
                &times;
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Pilih profil pengguna untuk melihat aplikasi dari perspektif divisi tersebut. Hanya menu &amp; fitur yang relevan yang akan ditampilkan.
            </p>

            <div className="mt-4 space-y-2.5">
              {(Object.keys(ROLE_CONFIGS) as RoleType[]).map((rKey) => {
                const conf = ROLE_CONFIGS[rKey];
                const isSelected = role === rKey;
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => {
                      switchRole(rKey);
                      setShowRoleModal(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl p-3.5 text-left transition-all ${
                      isSelected
                        ? "bg-[#1c1d22] text-white shadow-md ring-2 ring-[#84cc16]"
                        : "bg-[#f8f9f6] text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 ring-1 ring-black/5">
                        <AvatarFallback className={`text-xs font-bold ${conf.avatarBg}`}>
                          {conf.avatarText}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{conf.name}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                              isSelected ? "bg-white/20 text-[#84cc16]" : conf.badgeColor
                            }`}
                          >
                            {conf.id.toUpperCase()}
                          </span>
                        </div>
                        <p className={`text-[11px] ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                          {conf.roleTitle}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="size-5 text-[#84cc16]" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
