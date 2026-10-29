"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, Search } from "lucide-react";
import { BatchTable, CategoryBadge } from "@/components/palm/BatchTable";
import { deleteBatch, listBatches, resetBatches } from "@/lib/api-client";
import type { PalmBatch } from "@/lib/palm-db";

export default function BatchesPage() {
  const [batches, setBatches] = useState<PalmBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resetting, setResetting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBatches(search ? { search } : {});
      setBatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const handleDelete = useCallback(
    async (batchId: string) => {
      try {
        await deleteBatch(batchId);
        setBatches((prev) => prev.filter((b) => b.batch_id !== batchId));
        setFlash(`Batch [${batchId}] berhasil dihapus.`);
      } catch (err) {
        setFlash(String(err instanceof Error ? err.message : err));
      }
    },
    []
  );

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      await resetBatches();
      await load();
      setFlash("Database berhasil direset ke data awal PKS.");
    } catch (err) {
      setFlash(String(err instanceof Error ? err.message : err));
    } finally {
      setResetting(false);
    }
  }, [load]);

  const counts = {
    total: batches.length,
    cpo: batches.filter((b) => b.category === "CPO_DEFAULT").length,
    bio: batches.filter((b) => b.category === "BIO_ECO_FRIENDLY").length,
    other: batches.filter((b) => b.category === "OTHER_PRODUCTS").length,
  };

  return (
    <>
      {/* Header + controls */}
      <div className="stat-card-shadow rounded-[1.5rem] bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#1c1d22]">
              Inventaris Lot Panen
            </h1>
            <p className="mt-0.5 text-[11px] text-gray-400">
              Daftar seluruh lot panen yang telah dievaluasi &amp; dialokasikan mesin keputusan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Batch ID / kebun..."
                className="h-10 w-full rounded-xl border border-gray-100 bg-[#f8f9f6] pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#a3e635] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#f2f4ef] px-3.5 text-xs font-bold text-gray-600 transition-colors hover:bg-[#e8ebe3] disabled:opacity-60"
            >
              {resetting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4 text-[#65a30d]" />
              )}
              Reset
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[#1c1d22] px-2.5 py-1 text-[11px] font-bold text-white">
            {counts.total} lot
          </span>
          <CategoryBadge category="CPO_DEFAULT" />
          <span className="text-[11px] font-bold text-[#65a30d]">{counts.cpo}</span>
          <CategoryBadge category="BIO_ECO_FRIENDLY" />
          <span className="text-[11px] font-bold text-blue-600">{counts.bio}</span>
          <CategoryBadge category="OTHER_PRODUCTS" />
          <span className="text-[11px] font-bold text-orange-600">{counts.other}</span>
        </div>

        {flash && (
          <p className="mt-3 rounded-xl bg-[#eef2e2] px-3 py-2 text-xs font-semibold text-[#65a30d]">
            {flash}
          </p>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-300">
            <Loader2 className="mr-2 size-5 animate-spin text-[#84cc16]" /> Memuat inventaris...
          </div>
        ) : (
          <div className="mt-4">
            <BatchTable batches={batches} onDelete={handleDelete} />
          </div>
        )}
      </div>
    </>
  );
}
