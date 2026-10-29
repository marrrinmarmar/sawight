"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Atom,
  LayoutGrid,
  FlaskConical,
  Boxes,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/", icon: LayoutGrid, label: "Dashboard" },
  { href: "/simulator", icon: FlaskConical, label: "Simulator" },
  { href: "/batches", icon: Boxes, label: "Inventaris" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-20 shrink-0 flex-col items-center rounded-r-[1.75rem] bg-[#1c1d22] py-6">
      {/* Logo */}
      <Link
        href="/"
        aria-label="PalmQual-AI — kembali ke dashboard"
        className="flex h-10 w-10 items-center justify-center"
      >
        <Atom className="size-8 text-[#84cc16]" strokeWidth={1.75} />
      </Link>

      {/* Navigation */}
      <nav className="mt-14 flex flex-col items-center gap-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={
                active
                  ? "group relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "group relative flex h-11 w-11 items-center justify-center rounded-2xl text-[#9ba0a8] transition-colors hover:bg-white/5 hover:text-white"
              }
            >
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              {/* Hover tooltip */}
              <span className="pointer-events-none absolute left-12 z-20 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-[#1c1d22] opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Log out */}
      <button
        type="button"
        aria-label="Log out"
        title="Log out"
        className="flex h-11 w-11 items-center justify-center rounded-2xl text-[#9ba0a8] transition-colors hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-5" strokeWidth={1.8} />
      </button>

      {/* User avatar */}
      <div className="mt-5">
        <Avatar className="size-10 ring-2 ring-white/15">
          <AvatarFallback className="bg-[#84cc16] text-[13px] font-bold text-[#1c1d22]">
            PQ
          </AvatarFallback>
        </Avatar>
      </div>
    </aside>
  );
}
