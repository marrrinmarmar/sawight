"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandHeader } from "@/components/palm/BrandHeader";
import { PalmKpiCards } from "@/components/palm/PalmKpiCards";
import { AllocationChart } from "@/components/palm/AllocationChart";
import { FfaHoldScatter } from "@/components/palm/FfaHoldScatter";
import { BatchTable } from "@/components/palm/BatchTable";
import { ThresholdMatrix } from "@/components/palm/ThresholdMatrix";
import { getStats, listBatches } from "@/lib/api-client";
import type { PalmBatch, PalmStats } from "@/lib/palm-db";

export default function DashboardPage() {
  const [stats, setStats] = useState<PalmStats | null>(null);
  const [batches, setBatches] = useState<PalmBatch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = (isInitial = false) => {
      Promise.all([getStats(), listBatches()])
        .then(([s, b]) => {
          setStats(s);
          setBatches(b);
        })
        .catch((err) => console.error(err))
        .finally(() => {
          if (isInitial) setLoaded(true);
        });
    };

    fetchData(true);
    const interval = setInterval(() => fetchData(false), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <BrandHeader
        stats={{
          total_batches: stats?.total_batches ?? 0,
          total_tonnage: stats?.total_tonnage ?? 0,
        }}
      />

      {/* 3-Role Workflow Quick Navigation */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/pengelola"
          className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-[#84cc16] hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-[#f4f7ee] px-2.5 py-1 text-[10px] font-bold text-[#65a30d]">
              Role 1 • Pengelola
            </span>
            <ArrowUpRight className="size-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#65a30d]" />
          </div>
          <h3 className="mt-2.5 text-sm font-bold text-[#1c1d22]">Pencatatan Bahan &amp; Auto ID</h3>
          <p className="mt-1 text-[11px] text-gray-400">
            Ekstraksi TBS cair, catat berat timbangan, hold time, &amp; generate batch ID otomatis.
          </p>
        </Link>

        <Link
          href="/lab"
          className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
              Role 2 • Laboratorium
            </span>
            <ArrowUpRight className="size-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-600" />
          </div>
          <h3 className="mt-2.5 text-sm font-bold text-[#1c1d22]">Uji Kualitas &amp; Surat COA</h3>
          <p className="mt-1 text-[11px] text-gray-400">
            Gunakan berat &amp; hold time acuan, uji pH, kadar FFA, dan terbitkan surat analisis AI.
          </p>
        </Link>

        <Link
          href="/gudang"
          className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-amber-500 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
              Role 3 • Gudang &amp; Distribusi
            </span>
            <ArrowUpRight className="size-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-amber-600" />
          </div>
          <h3 className="mt-2.5 text-sm font-bold text-[#1c1d22]">Sortir Kategori &amp; Antrean FIFO</h3>
          <p className="mt-1 text-[11px] text-gray-400">
            Periksa surat lab, sortir tangki per grade, dan eksekusi pengeluaran barang berbasis FIFO.
          </p>
        </Link>
      </div>

      {/* KPI mutu */}
      <PalmKpiCards stats={stats} />

      {/* Charts: alokasi + korelasi */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.35fr]">
        <AllocationChart stats={stats} />
        <FfaHoldScatter batches={batches} />
      </div>

      {/* Daftar Lot Panen Masuk */}
      <div className="stat-card-shadow rounded-[1.5rem] bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#1c1d22]">
              Daftar Lot Panen Masuk
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-400">
              Enam lot terbaru beserta status alokasi hilirisasi.
            </p>
          </div>
          <Link
            href="/batches"
            className="flex items-center gap-1 rounded-full bg-[#f2f4ef] px-3.5 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-[#e8ebe3]"
          >
            Inventaris Lengkap
            <ArrowUpRight className="size-3 text-gray-400" />
          </Link>
        </div>
        <div className="mt-3">
          {loaded ? (
            <BatchTable batches={batches.slice(0, 6)} />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-gray-300">
              Memuat data lot...
            </div>
          )}
        </div>
      </div>

      {/* Matriks ambang batas */}
      <ThresholdMatrix />
    </>
  );
}
