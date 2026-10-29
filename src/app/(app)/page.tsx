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
    Promise.all([getStats(), listBatches()])
      .then(([s, b]) => {
        setStats(s);
        setBatches(b);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <>
      <BrandHeader
        stats={{
          total_batches: stats?.total_batches ?? 0,
          total_tonnage: stats?.total_tonnage ?? 0,
        }}
      />

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
