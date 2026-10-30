"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  FileText,
  Truck,
  CheckCircle2,
  Calendar,
  Clock,
  Scale,
  ShieldCheck,
  AlertCircle,
  Eye,
  X,
  Printer,
  Sparkles,
  ArrowUpDown,
  Filter
} from "lucide-react";
import { listBatches, patchBatch } from "@/lib/api-client";
import { CoaStamp } from "@/components/palm/CoaStamp";
import type { PalmBatch } from "@/lib/palm-db";

const CATEGORY_TABS = [
  { id: "ALL", label: "Semua Kategori" },
  { id: "CPO_DEFAULT", label: "CPO Pangan (Super CPO)" },
  { id: "BIO_ECO_FRIENDLY", label: "Biodiesel / Eco" },
  { id: "OTHER_PRODUCTS", label: "Oleokimia / Non-Bio" },
];

export default function GudangPage() {
  const [batches, setBatches] = useState<PalmBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeBatchModal, setActiveBatchModal] = useState<PalmBatch | null>(null);
  const [dispatchModalBatch, setDispatchModalBatch] = useState<PalmBatch | null>(null);

  // Form Pengiriman Distribusi
  const [dispatchForm, setDispatchForm] = useState({
    destination: "PT Wilmar Nabati Indonesia - Pelabuhan Dumai",
    notes: "Pengiriman via Kapal Tongkang CPO-04",
  });
  const [submittingDispatch, setSubmittingDispatch] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await listBatches();
      setBatches((prev) => {
        // Deteksi batch yang baru saja lolos pengujian lab
        if (prev.length > 0) {
          const prevReady = new Set(
            prev.filter((p) => p.status === "READY_WAREHOUSE").map((p) => p.batch_id)
          );
          const newReady = data
            .filter((d) => d.status === "READY_WAREHOUSE" && !prevReady.has(d.batch_id))
            .map((d) => d.batch_id);

          if (newReady.length > 0) {
            setNewlyArrivedIds((old) => new Set([...old, ...newReady]));
            setTimeout(() => {
              setNewlyArrivedIds((curr) => {
                const next = new Set(curr);
                newReady.forEach((id) => next.delete(id));
                return next;
              });
            }, 3500);
          }
        }
        return data;
      });
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // Polling otomatis setiap 3 detik secara silent agar batch yang baru divalidasi Lab langsung tampil
  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  // FIFO Sorting:
  // Hanya menampilkan batch yang sudah diuji oleh Lab (memiliki rekomendasi / status READY_WAREHOUSE / DISPATCHED)
  // Diurutkan berdasarkan waktu tertua (created_at atau jam_masuk paling awal didahulukan)
  const fifoBatches = useMemo(() => {
    let list = batches.filter((b) => b.kadar_ffa_percent > 0 || b.lab_certificate_no);

    if (selectedCategory !== "ALL") {
      list = list.filter((b) => b.category === selectedCategory);
    }

    // Urutkan FIFO: yang masuk lebih awal berada di posisi teratas
    return list.sort((a, b) => {
      // Prioritaskan yang belum didistribusikan
      if (a.status !== "DISPATCHED" && b.status === "DISPATCHED") return -1;
      if (a.status === "DISPATCHED" && b.status !== "DISPATCHED") return 1;

      const timeA = new Date(a.jam_masuk || a.tanggal_panen || a.created_at).getTime();
      const timeB = new Date(b.jam_masuk || b.tanggal_panen || b.created_at).getTime();
      return timeA - timeB; // Tertua di atas
    });
  }, [batches, selectedCategory]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalBatch) return;

    setSubmittingDispatch(true);
    try {
      await patchBatch(dispatchModalBatch.batch_id, {
        status: "DISPATCHED",
        dispatched_at: new Date().toISOString(),
        dispatch_destination: dispatchForm.destination,
        dispatch_notes: dispatchForm.notes,
      });

      setFlashMsg(`Batch [${dispatchModalBatch.batch_id}] berhasil dicatat keluar gudang untuk distribusi.`);
      setDispatchModalBatch(null);
      await loadData();
    } catch (err) {
      alert("Gagal melakukan distribusi: " + String(err));
    } finally {
      setSubmittingDispatch(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info */}
      <div className="stat-card-shadow flex flex-col justify-between gap-4 rounded-[1.75rem] bg-gradient-to-r from-[#1c1d22] to-[#222a27] p-6 text-white md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#84cc16]/20 px-3 py-1 text-xs font-bold text-[#a3e635]">
            <Boxes className="size-3.5" />
            Unit Manajemen Tangki &amp; Distribusi Gudang
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Surat Lab, Sortir Kategori &amp; Pengeluaran Gudang (FIFO)
          </h1>
          <p className="text-xs text-gray-400">
            Penyortiran tangki per grade mutu, prioritas pengeluaran berdasarkan waktu simpan terlama (FIFO), serta surat resmi COA dari laboratorium.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-mono font-semibold text-emerald-400 md:self-auto">
          <ArrowUpDown className="size-4" />
          Prioritas: FIFO (First-In, First-Out)
        </div>
      </div>

      {flashMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>{flashMsg}</span>
          </div>
          <button type="button" onClick={() => setFlashMsg(null)} className="text-emerald-700">
            &times;
          </button>
        </div>
      )}

      {/* Filter Tabs Per Kategori */}
      <div className="stat-card-shadow rounded-[1.5rem] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 pr-2">
            <Filter className="size-3.5" /> Filter Kategori:
          </span>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                selectedCategory === tab.id
                  ? "bg-[#1c1d22] text-[#84cc16] shadow-sm"
                  : "bg-[#f8f9f6] text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Inventori Gudang FIFO */}
      <div className="stat-card-shadow rounded-[1.75rem] bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#1c1d22]">Antrean Tangki Siap Distribusi</h2>
            <p className="text-[11px] text-gray-400">
              Diurutkan FIFO berdasarkan jam masuk/panen agar komoditas tidak mengalami oksidasi FFA berlebih di tangki simpan.
            </p>
          </div>
          <span className="rounded-lg bg-[#f4f7ee] px-2.5 py-1 font-mono text-xs font-bold text-[#65a30d]">
            Total {fifoBatches.length} Lot Siap
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Memuat stok gudang...</div>
        ) : fifoBatches.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Tidak ada batch yang telah diverifikasi lab untuk kategori ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-3 py-3">Prioritas FIFO</th>
                  <th className="px-3 py-3">Batch ID</th>
                  <th className="px-3 py-3">Waktu Masuk / Panen</th>
                  <th className="px-3 py-3 text-right">Tonase</th>
                  <th className="px-3 py-3 text-right">Hold (Jam)</th>
                  <th className="px-3 py-3 text-right">FFA Lab</th>
                  <th className="px-3 py-3">Kategori Mutu</th>
                  <th className="px-3 py-3">Surat Lab</th>
                  <th className="px-3 py-3 text-right">Status &amp; Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fifoBatches.map((b, idx) => {
                  const isDispatched = b.status === "DISPATCHED";
                  const isNewlyArrived = newlyArrivedIds.has(b.batch_id);
                  return (
                    <tr
                      key={b.batch_id}
                      className={`transition-all duration-300 ${
                        isNewlyArrived ? "animate-slide-down animate-highlight-new" : ""
                      } ${
                        isDispatched ? "bg-gray-50/60 opacity-60" : "hover:bg-[#fbfcf9]"
                      }`}
                    >
                      {/* Urutan FIFO */}
                      <td className="px-3 py-3 font-mono font-bold">
                        <div className="flex items-center gap-1.5">
                          {isNewlyArrived && (
                            <span className="flex size-2 rounded-full bg-[#84cc16] animate-ping" />
                          )}
                          <span
                            className={`inline-flex size-6 items-center justify-center rounded-full text-[10px] ${
                              idx === 0 && !isDispatched
                                ? "bg-[#84cc16] text-[#1c1d22] font-black"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3 font-mono font-bold text-[#1c1d22]">
                        {b.batch_id}
                      </td>

                      <td className="px-3 py-3 text-[11px] text-gray-600">
                        {b.jam_masuk
                          ? new Date(b.jam_masuk).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : b.tanggal_panen?.slice(0, 10)}
                      </td>

                      <td className="px-3 py-3 text-right font-mono font-semibold">{b.berat_ton} t</td>

                      <td className="px-3 py-3 text-right font-mono">
                        <span
                          className={
                            b.lama_penyimpanan_jam > 48
                              ? "text-red-600 font-bold"
                              : b.lama_penyimpanan_jam > 24
                              ? "text-amber-600"
                              : "text-gray-600"
                          }
                        >
                          {b.lama_penyimpanan_jam} jam
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right font-mono font-bold text-[#65a30d]">
                        {b.kadar_ffa_percent}%
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            b.category === "CPO_DEFAULT"
                              ? "bg-[#eef2e2] text-[#65a30d]"
                              : b.category === "BIO_ECO_FRIENDLY"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-orange-50 text-orange-600"
                          }`}
                        >
                          {b.category === "CPO_DEFAULT"
                            ? "CPO Pangan"
                            : b.category === "BIO_ECO_FRIENDLY"
                            ? "Biodiesel"
                            : "Oleokimia"}
                        </span>
                      </td>

                      {/* Tombol Lihat Surat Lab */}
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setActiveBatchModal(b)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                        >
                          <FileText className="size-3 text-[#65a30d]" />
                          <span>Surat Lab</span>
                        </button>
                      </td>

                      {/* Aksi Distribusi */}
                      <td className="px-3 py-3 text-right">
                        {isDispatched ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-gray-500 text-[11px]">
                            <CheckCircle2 className="size-3.5 text-gray-400" />
                            Keluar ({b.dispatched_at?.slice(0, 10)})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDispatchModalBatch(b)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#84cc16] px-3 py-1.5 text-xs font-bold text-[#1c1d22] shadow-sm transition-all hover:bg-[#73b313]"
                          >
                            <Truck className="size-3.5" />
                            <span>Distribusi</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Surat Lab (COA) */}
      {activeBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-6 text-[#65a30d]" />
                <div>
                  <h3 className="text-base font-bold text-[#1c1d22]">
                    Certificate of Analysis (COA) — Surat Hasil Lab
                  </h3>
                  <span className="font-mono text-xs text-gray-400">
                    No: {activeBatchModal.lab_certificate_no || `COA/LAB/2026/${activeBatchModal.batch_id}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveBatchModal(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs text-gray-700">
              {/* Detail Header Surat */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[#f8f9f6] p-4 font-mono text-[11px]">
                <div>
                  <span className="text-gray-400 block font-sans">Batch ID</span>
                  <strong className="text-sm text-[#1c1d22]">{activeBatchModal.batch_id}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Tonase Cairan</span>
                  <strong className="text-sm text-[#1c1d22]">{activeBatchModal.berat_ton} Ton</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Holding Time Sebelum Lab</span>
                  <strong>{activeBatchModal.lama_penyimpanan_jam} Jam</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Asal Kebun</span>
                  <strong>{activeBatchModal.lokasi_kebun}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Tanggal Uji Lab</span>
                  <strong>{activeBatchModal.lab_tested_at || activeBatchModal.created_at}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Analis Lab</span>
                  <strong>{activeBatchModal.lab_analyst || "Lab Tim Sawight PKS"}</strong>
                </div>
              </div>

              {/* Tabel Parameter Uji */}
              <div>
                <h4 className="font-bold text-[#1c1d22] mb-2">Parameter Fisika-Kimia Terverifikasi:</h4>
                <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                  <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <span className="text-[10px] text-gray-400 block">Kadar FFA</span>
                    <strong className="text-base text-[#65a30d]">{activeBatchModal.kadar_ffa_percent}%</strong>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <span className="text-[10px] text-gray-400 block">pH Sampel</span>
                    <strong className="text-base text-[#1c1d22]">{activeBatchModal.pH}</strong>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <span className="text-[10px] text-gray-400 block">Moisture</span>
                    <strong className="text-base text-[#1c1d22]">{activeBatchModal.moisture_percent}%</strong>
                  </div>
                </div>
              </div>

              {/* Keputusan Alokasi */}
              <div className="rounded-2xl border border-[#a3e635]/40 bg-[#f7fee7] p-4 text-[#365314] space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#4d7c0f] block">
                    Rekomendasi Utama (Primary):
                  </span>
                  <div className="mt-0.5 font-bold text-sm text-[#1c1d22]">
                    {activeBatchModal.primary_recommendation}
                  </div>
                </div>

                {activeBatchModal.alternate_recommendation && activeBatchModal.alternate_recommendation !== "-" && (
                  <div className="border-t border-[#a3e635]/30 pt-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">
                      Rekomendasi Alternatif:
                    </span>
                    <div className="mt-0.5 font-medium text-xs text-gray-800">
                      {activeBatchModal.alternate_recommendation}
                    </div>
                  </div>
                )}

                <div className="border-t border-[#a3e635]/30 pt-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Penjelasan Analisis Mutu AI:
                  </span>
                  <p className="mt-0.5 text-xs italic text-gray-700">{activeBatchModal.ai_explanation}</p>
                </div>
              </div>

              {/* Cap Stempel Resmi & TTD Analis */}
              <CoaStamp
                analystName={activeBatchModal.lab_analyst || "Dr. Siti Rahma (QC Head)"}
                testedAt={activeBatchModal.lab_tested_at || activeBatchModal.created_at}
                certNo={activeBatchModal.lab_certificate_no}
                statusText="MUTU TERVERIFIKASI"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Printer className="size-4" /> Cetak COA
              </button>
              <button
                type="button"
                onClick={() => setActiveBatchModal(null)}
                className="rounded-xl bg-[#1c1d22] px-5 py-2 text-xs font-bold text-white hover:bg-black"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Distribusi Keluar Gudang */}
      {dispatchModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-[#84cc16]" />
                <h3 className="text-base font-bold text-[#1c1d22]">Form Pengeluaran Tangki Distribusi</h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalBatch(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl bg-[#f8f9f6] p-3 font-mono">
                <div>
                  Batch ID: <strong>{dispatchModalBatch.batch_id}</strong> ({dispatchModalBatch.berat_ton} Ton)
                </div>
                <div>
                  Kategori: <strong>{dispatchModalBatch.category}</strong>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-600">
                  Tujuan Pengiriman / Buyer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={dispatchForm.destination}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, destination: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] px-3.5 text-xs text-gray-800 outline-none focus:border-[#a3e635] focus:bg-white"
                  placeholder="Nama Pembeli / Refinery / Pelabuhan"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-600">
                  Catatan Dokumen DO / Moda Transportasi
                </label>
                <textarea
                  rows={3}
                  value={dispatchForm.notes}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-[#f8f9f6] p-3 text-xs text-gray-800 outline-none focus:border-[#a3e635] focus:bg-white"
                  placeholder="No. Delivery Order, No. Polisi Truk Tangki, dsb."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalBatch(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingDispatch}
                  className="flex items-center gap-2 rounded-xl bg-[#84cc16] px-5 py-2 font-bold text-[#1c1d22] hover:bg-[#73b313] disabled:opacity-50"
                >
                  <Truck className="size-4" />
                  <span>{submittingDispatch ? "Memproses..." : "Konfirmasi Keluar Gudang"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
