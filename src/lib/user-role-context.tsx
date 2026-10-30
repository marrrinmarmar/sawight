"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export type RoleType = "all" | "pengelola" | "lab" | "gudang";

export interface RoleConfig {
  id: RoleType;
  name: string;
  roleTitle: string;
  avatarText: string;
  badgeColor: string;
  avatarBg: string;
  allowedPaths: string[];
  defaultPath: string;
  description: string;
}

export const ROLE_CONFIGS: Record<RoleType, RoleConfig> = {
  all: {
    id: "all",
    name: "Super Admin",
    roleTitle: "Manajemen PKS Terpusat",
    avatarText: "PQ",
    badgeColor: "bg-[#84cc16] text-[#1c1d22]",
    avatarBg: "bg-[#84cc16] text-[#1c1d22]",
    allowedPaths: ["/", "/pengelola", "/lab", "/gudang", "/simulator", "/batches", "/settings"],
    defaultPath: "/",
    description: "Akses menyeluruh seluruh modul sistem",
  },
  pengelola: {
    id: "pengelola",
    name: "Budi Santoso",
    roleTitle: "Divisi Pengolahan & Ekstraksi Cair",
    avatarText: "PL",
    badgeColor: "bg-[#84cc16] text-[#1c1d22]",
    avatarBg: "bg-[#84cc16] text-[#1c1d22]",
    allowedPaths: ["/pengelola", "/batches", "/settings"],
    defaultPath: "/pengelola",
    description: "Input bahan mentah cair, timbangan, & generate Batch ID",
  },
  lab: {
    id: "lab",
    name: "Dr. Siti Rahma",
    roleTitle: "Quality Control & Laboratorium",
    avatarText: "LB",
    badgeColor: "bg-emerald-500 text-white",
    avatarBg: "bg-emerald-500 text-white",
    allowedPaths: ["/lab", "/batches", "/settings"],
    defaultPath: "/lab",
    description: "Pengujian mutu sampel (pH, FFA) & penerbitan COA",
  },
  gudang: {
    id: "gudang",
    name: "Agus Pratama",
    roleTitle: "Logistik & Gudang Distribusi",
    avatarText: "GD",
    badgeColor: "bg-amber-500 text-white",
    avatarBg: "bg-amber-500 text-white",
    allowedPaths: ["/gudang", "/batches", "/settings"],
    defaultPath: "/gudang",
    description: "Sortir kategori tangki, antrean FIFO, & pengeluaran DO",
  },
};

interface UserRoleContextType {
  role: RoleType;
  setRole: (role: RoleType) => void;
  currentRoleConfig: RoleConfig;
  switchRole: (role: RoleType) => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<RoleType>("all");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("sawight_active_role") as RoleType | null;
    if (saved && ROLE_CONFIGS[saved]) {
      setRoleState(saved);
    }
  }, []);

  const switchRole = (newRole: RoleType) => {
    setRoleState(newRole);
    localStorage.setItem("sawight_active_role", newRole);
    const config = ROLE_CONFIGS[newRole];
    // Jika path saat ini tidak diperbolehkan untuk role yang baru dipilih, arahkan ke defaultPath
    if (!config.allowedPaths.includes(pathname)) {
      router.push(config.defaultPath);
    }
  };

  const currentRoleConfig = ROLE_CONFIGS[role];

  return (
    <UserRoleContext.Provider
      value={{
        role,
        setRole: setRoleState,
        currentRoleConfig,
        switchRole,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return ctx;
}
