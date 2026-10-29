"use client";

import { Fragment, useState } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import type { PalmBatch } from "@/lib/palm-db";

const CATEGORY_STYLES: Record<string, string> = {
  CPO_DEFAULT: "bg-[#eef2e2] text-[#65a30d]",
  BIO_ECO_FRIENDLY: "bg-blue-50 text-blue-600",
  OTHER_PRODUCTS: "bg-orange-50 text-orange-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  CPO_DEFAULT: "CPO Pangan",
  BIO_ECO_FRIENDLY: "Bio / Eco",
  OTHER_PRODUCTS: "Produk Lain",
};

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-bold ${
        CATEGORY_STYLES[category] || "bg-gray-100 text-gray-500"
      }`}
    >
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}

export function BatchTable({
  batches,
  onDelete,
  emptyText = "Belum ada lot panen terdaftar.",
}: {
  batches: PalmBatch[];
  onDelete?: (batchId: string) => void;
  emptyText?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!batches.length) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <th className="px-2 py-2.5">Batch ID</th>
            <th className="px-2 py-2.5">Lokasi Kebun</th>
            <th className="px-2 py-2.5 text-right">Hold</th>
            <th className="px-2 py-2.5 text-right">FFA</th>
            <th className="px-2 py-2.5 text-right">Tonase</th>
            <th className="px-2 py-2.5">Alokasi</th>
            <th className="px-2 py-2.5 text-right">Keyakinan</th>
            <th className="px-2 py-2.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <Fragment key={b.batch_id}>
              <tr
                className={`border-b border-gray-50 text-xs text-gray-700 transition-colors hover:bg-[#f8f9f6]`}
              >
                <td className="px-2 py-3 font-mono font-semibold text-[#1c1d22]">{b.batch_id}</td>
                <td className="max-w-44 truncate px-2 py-3">{b.lokasi_kebun}</td>
                <td className="px-2 py-3 text-right font-mono">
                  {Number(b.lama_penyimpanan_jam)} jam
                </td>
                <td className="px-2 py-3 text-right font-mono">{Number(b.kadar_ffa_percent)}%</td>
                <td className="px-2 py-3 text-right font-mono">{Number(b.berat_ton)} t</td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1.5">
                    <CategoryBadge category={b.category} />
                    <button
                      type="button"
                      aria-label="Detail"
                      onClick={() => setExpanded(expanded === b.batch_id ? null : b.batch_id)}
                      className="rounded-full p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <ChevronDown
                        className={`size-3.5 transition-transform ${
                          expanded === b.batch_id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-3 text-right">
                  <span className="font-mono font-bold text-[#65a30d]">
                    {Number(b.confidence_score).toFixed(1)}%
                  </span>
                </td>
                <td className="px-2 py-3 text-right">
                  {onDelete && (
                    <button
                      type="button"
                      aria-label={`Hapus ${b.batch_id}`}
                      onClick={() => onDelete(b.batch_id)}
                      className="rounded-full p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </td>
              </tr>
              {expanded === b.batch_id && (
                <tr className="bg-[#f8f9f6]">
                  <td colSpan={8} className="px-4 py-4">
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Alokasi utama
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#1c1d22]">
                        {b.primary_recommendation}
                      </p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Alternatif
                      </p>
                      <p className="mt-1 text-xs text-gray-600">{b.alternate_recommendation}</p>
                      <p className="mt-3 rounded-xl bg-[#f2f4ef] p-3 text-[11px] leading-relaxed text-gray-600">
                        {b.ai_explanation}
                      </p>
                      <ol className="mt-3 space-y-1">
                        {b.action_steps.map((step, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-gray-600">
                            <span className="font-mono font-bold text-[#65a30d]">{i + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
