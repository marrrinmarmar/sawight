"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function BrandHeader({ stats }: { stats: { total_batches: number; total_tonnage: number } }) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-[#dfe6d6] via-[#e7ebe3] to-[#eef0ea] p-5">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        {/* Brand */}
        <div className="flex items-start gap-4">
          <div className="overflow-hidden rounded-2xl bg-white p-1 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="PalmQual-AI" className="size-16 rounded-xl object-cover" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#65a30d]">PALMQUAL-AI</p>
            <h1 className="mt-1 max-w-md text-2xl font-extrabold leading-tight tracking-tight text-[#1c1d22] md:text-3xl">
              Quality Assessment &amp; Downstream Allocation System
            </h1>
            <p className="mt-1.5 max-w-lg text-xs text-gray-500">
              Sistem analitik berbasis mutu biokimia untuk klasifikasi panen kelapa sawit,
              monitoring hold time, dan penentuan alokasi optimal.
            </p>
          </div>
        </div>

        {/* Quick stats + CTA */}
        <div className="flex items-center gap-3">
          <div className="stat-card-shadow rounded-2xl bg-white px-4 py-3">
            <p className="text-xl font-bold tracking-tight text-[#1c1d22]">
              {stats.total_batches}
            </p>
            <p className="text-[10px] font-semibold tracking-wider text-gray-500">
              LOT PANEN MASUK
            </p>
          </div>
          <div className="stat-card-shadow rounded-2xl bg-white px-4 py-3">
            <p className="text-xl font-bold tracking-tight text-[#1c1d22]">{stats.total_tonnage}t</p>
            <p className="text-[10px] font-semibold tracking-wider text-gray-500">TOTAL TONASE</p>
          </div>
          <Link
            href="/simulator"
            className="group flex items-center gap-2 rounded-2xl bg-[#1c1d22] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-black"
          >
            Uji Sampel Baru
            <ArrowUpRight className="size-4 text-[#a3e635] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
