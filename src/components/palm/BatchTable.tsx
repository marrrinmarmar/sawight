import { Fragment, useState } from "react";
import { Trash2, ChevronDown, Info, ExternalLink, Calendar, MapPin, Truck } from "lucide-react";
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
            <th className="px-3 py-2.5">Batch ID</th>
            <th className="px-3 py-2.5">Lokasi Kebun</th>
            <th className="px-3 py-2.5 text-right">Hold</th>
            <th className="px-3 py-2.5 text-right">FFA</th>
            <th className="px-3 py-2.5 text-right">Tonase</th>
            <th className="px-3 py-2.5">Alokasi &amp; Rekomendasi</th>
            <th className="px-3 py-2.5">Status Inventaris</th>
            <th className="px-3 py-2.5 text-right">Keyakinan</th>
            <th className="px-3 py-2.5 text-right">Detail &amp; Aksi</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => {
            const isDispatched = b.status === "DISPATCHED";
            const isWaitingLab = b.status === "WAITING_LAB";
            const isExpanded = expanded === b.batch_id;

            return (
              <Fragment key={b.batch_id}>
                <tr
                  onClick={() => setExpanded(isExpanded ? null : b.batch_id)}
                  className={`group cursor-pointer border-b border-gray-50 text-xs transition-all duration-200 ${
                    isExpanded
                      ? "bg-[#f4f7ee]/70 shadow-sm"
                      : isDispatched
                      ? "bg-gray-50/50 text-gray-500 hover:bg-[#f8f9f6]"
                      : "text-gray-700 hover:bg-[#f8f9f6] hover:translate-x-0.5"
                  }`}
                  title="Klik baris ini untuk melihat rincian alokasi & keputusan AI"
                >
                  <td className="px-3 py-3 font-mono font-semibold text-[#1c1d22]">
                    <span className="group-hover:text-[#65a30d] group-hover:underline transition-colors">
                      {b.batch_id}
                    </span>
                  </td>
                  <td className="max-w-44 truncate px-3 py-3" title={b.lokasi_kebun}>
                    {b.lokasi_kebun}
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    {Number(b.lama_penyimpanan_jam)} jam
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold">
                    {b.kadar_ffa_percent > 0 ? `${Number(b.kadar_ffa_percent)}%` : "-"}
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{Number(b.berat_ton)} t</td>

                  {/* Alokasi dengan hover info */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <CategoryBadge category={b.category} />
                      <span className="max-w-[130px] truncate text-[11px] text-gray-500 hidden sm:inline" title={b.primary_recommendation}>
                        {b.primary_recommendation}
                      </span>
                    </div>
                  </td>

                  {/* Status Inventaris */}
                  <td className="px-3 py-3">
                    {isDispatched ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="size-1.5 rounded-full bg-emerald-600" />
                        Telah Terdistribusi
                      </span>
                    ) : isWaitingLab ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Menunggu Lab
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                        <span className="size-1.5 rounded-full bg-blue-500" />
                        Di Tangki Gudang
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <span className="font-mono font-bold text-[#65a30d]">
                      {Number(b.confidence_score) > 0 ? `${Number(b.confidence_score).toFixed(1)}%` : "-"}
                    </span>
                  </td>

                  {/* Tombol Detail & Hapus */}
                  <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label="Buka Detail Lot"
                        title={isExpanded ? "Tutup Detail" : "Buka Detail Lot"}
                        onClick={() => setExpanded(isExpanded ? null : b.batch_id)}
                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                          isExpanded
                            ? "bg-[#1c1d22] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-[#84cc16] hover:text-[#1c1d22]"
                        }`}
                      >
                        <span className="hidden sm:inline">{isExpanded ? "Tutup" : "Detail"}</span>
                        <ChevronDown
                          className={`size-3 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {onDelete && (
                        <button
                          type="button"
                          aria-label={`Hapus ${b.batch_id}`}
                          title="Hapus Batch"
                          onClick={() => onDelete(b.batch_id)}
                          className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded Detailed View */}
                {isExpanded && (
                  <tr className="bg-[#f8f9f6]/80 animate-slide-down">
                    <td colSpan={9} className="px-4 py-4">
                      <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100 shadow-sm space-y-4">
                        {/* Header Detail Lot */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#1c1d22]">{b.batch_id}</span>
                            <CategoryBadge category={b.category} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Hold: <strong>{b.lama_penyimpanan_jam} jam</strong></span>
                            <span>Berat: <strong>{b.berat_ton} ton</strong></span>
                            <span>FFA: <strong className="text-[#65a30d]">{b.kadar_ffa_percent}%</strong></span>
                          </div>
                        </div>

                        {/* Jika sudah terdistribusi */}
                        {isDispatched && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 font-sans">
                            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase text-emerald-800">
                              <Truck className="size-3.5" />
                              Data Pengeluaran Gudang (Distribusi Selesai):
                            </div>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                              <div>
                                <span className="text-gray-500 font-sans">Waktu Keluar:</span>{" "}
                                <strong>
                                  {b.dispatched_at
                                    ? new Date(b.dispatched_at).toLocaleString("id-ID")
                                    : "-"}
                                </strong>
                              </div>
                              <div>
                                <span className="text-gray-500 font-sans">Tujuan Buyer:</span>{" "}
                                <strong>{b.dispatch_destination || "-"}</strong>
                              </div>
                              <div>
                                <span className="text-gray-500 font-sans">Catatan DO:</span>{" "}
                                <strong>{b.dispatch_notes || "-"}</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Grid Rekomendasi Utama & Alternatif */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl bg-[#f8faf2] p-3.5 border border-[#a3e635]/40">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7c0f] block">
                              Alokasi Utama (Primary Recommendation)
                            </span>
                            <p className="mt-1 font-bold text-[#1c1d22]">
                              {b.primary_recommendation}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                              Rekomendasi Alternatif
                            </span>
                            <p className="mt-1 text-gray-700">
                              {b.alternate_recommendation || "-"}
                            </p>
                          </div>
                        </div>

                        {/* Penjelasan AI */}
                        <div className="rounded-xl bg-[#f2f4ef] p-3.5 text-[11px] leading-relaxed text-gray-600">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            Analisis &amp; Penjelasan AI:
                          </span>
                          {b.ai_explanation}
                        </div>

                        {/* Langkah Aksi Operasional */}
                        {b.action_steps && b.action_steps.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                              Langkah Aksi Operasional PKS:
                            </span>
                            <ol className="space-y-1 text-xs">
                              {b.action_steps.map((step, i) => (
                                <li key={i} className="flex gap-2 text-[11px] text-gray-700">
                                  <span className="font-mono font-bold text-[#65a30d]">{i + 1}.</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
