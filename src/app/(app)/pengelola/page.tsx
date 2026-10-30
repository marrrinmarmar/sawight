"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Factory,
  CheckCircle2,
  Clock,
  Scale,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Boxes,
  MapPin,
  Calendar,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { createPengelolaBatch, listBatches } from "@/lib/api-client";
import type { PalmBatch } from "@/lib/palm-db";

const KEBUN_LIST = [
  "Kebun Riau Afdeling 1 - Blok A-08",
  "Kebun Riau Afdeling 2 - Blok B-12",
  "Kebun Sumut Sei Mangkei - Blok C-03",
  "Kebun Kaltim Paser - Line 2",
  "Kebun Sumsel Banyuasin - Blok D-05",
];

export default function PengelolaPage() {
  const getLocalIsoString = (d: Date = new Date()) => {
    const copy = new Date(d);
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
    return copy.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    batch_id: "",
    lokasi_kebun: KEBUN_LIST[0],
    tanggal_panen: "", // Input tanggal & jam panen buah
    jam_masuk: "", // Jam masuk otomatis dari sistem perangkat
    berat_ton: 26.5,
    lama_penyimpanan_jam: 8,
  });

  const [loading, setLoading] = useState(false);
  const [successBatch, setSuccessBatch] = useState<PalmBatch | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentBatches, setRecentBatches] = useState<PalmBatch[]>([]);

  // Generator Batch ID otomatis standar LOT-YYYYMMDD-HHMM dan sinkronisasi jam perangkat
  const generateNewBatchId = useCallback(() => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr =
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");
    const autoId = `LOT-${dateStr}-${timeStr}`;
    const localNowIso = getLocalIsoString(now);

    // Default panen: 8 jam sebelum jam masuk saat ini
    const defaultPanenDate = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const defaultPanenIso = getLocalIsoString(defaultPanenDate);

    setForm((f) => ({
      ...f,
      batch_id: autoId,
      jam_masuk: localNowIso,
      tanggal_panen: f.tanggal_panen || defaultPanenIso,
      lama_penyimpanan_jam: 8,
    }));
  }, []);

  // Update otomatis jam masuk sesuai jam laptop secara real-time setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      const nowIso = getLocalIsoString(new Date());
      setForm((prev) => {
        // Hitung ulang holding time jika tanggal_panen ada
        let holdTime = prev.lama_penyimpanan_jam;
        if (prev.tanggal_panen) {
          const panenTime = new Date(prev.tanggal_panen).getTime();
          const masukTime = new Date().getTime();
          const diffHours = (masukTime - panenTime) / (1000 * 60 * 60);
          holdTime = Math.max(0, Math.round(diffHours * 10) / 10);
        }
        return {
          ...prev,
          jam_masuk: nowIso,
          lama_penyimpanan_jam: holdTime,
        };
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handler saat pengelola mengubah tanggal & jam panen
  const handleTanggalPanenChange = (panenIso: string) => {
    let diffHours = form.lama_penyimpanan_jam;
    if (panenIso && form.jam_masuk) {
      const panenMs = new Date(panenIso).getTime();
      const masukMs = new Date(form.jam_masuk).getTime();
      const calculated = (masukMs - panenMs) / (1000 * 60 * 60);
      diffHours = Math.max(0, Math.round(calculated * 10) / 10);
    }
    setForm((f) => ({
      ...f,
      tanggal_panen: panenIso,
      lama_penyimpanan_jam: diffHours,
    }));
  };

  const loadRecent = useCallback(async () => {
    try {
      const data = await listBatches();
      setRecentBatches(data.slice(0, 8));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    generateNewBatchId();
    loadRecent();
    const interval = setInterval(loadRecent, 3000);
    return () => clearInterval(interval);
  }, [generateNewBatchId, loadRecent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessBatch(null);

    try {
      if (!form.berat_ton || form.berat_ton <= 0) {
        throw new Error("Berat bersih bahan cair harus lebih dari 0 ton.");
      }

      const res = await createPengelolaBatch({
        batch_id: form.batch_id,
        lokasi_kebun: form.lokasi_kebun,
        tanggal_panen: form.tanggal_panen ? new Date(form.tanggal_panen).toISOString() : new Date().toISOString(),
        jam_masuk: form.jam_masuk ? new Date(form.jam_masuk).toISOString() : new Date().toISOString(),
        berat_ton: Number(form.berat_ton),
        lama_penyimpanan_jam: Number(form.lama_penyimpanan_jam) || 0,
      });

      setSuccessBatch(res.data);
      generateNewBatchId();
      await loadRecent();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info Box */}
      <div className="stat-card-shadow flex flex-col justify-between gap-4 rounded-[1.75rem] bg-gradient-to-r from-[#1c1d22] to-[#2b2d35] p-6 text-white md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#84cc16]/20 px-3 py-1 text-xs font-bold text-[#a3e635]">
            <Factory className="size-3.5" />
            Unit Ekstraksi &amp; Pengolahan Cair (PKS)
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Pencatatan Bahan Pokok Cair &amp; Auto Batch ID
          </h1>
          <p className="text-xs text-gray-400">
            Catat hasil peleburan buah sawit menjadi fase cair, catat jam masuk, tonase, dan holding time sebelum sampel dikirim ke laboratorium.
          </p>
        </div>

        <button
          type="button"
          onClick={generateNewBatchId}
          className="flex items-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 md:self-auto"
        >
          <RotateCcw className="size-3.5 text-[#a3e635]" />
          Generate ID Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Pengelola */}
        <div className="stat-card-shadow rounded-[1.75rem] bg-white p-6 lg:col-span-7">
          <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#1c1d22]">Form Intake Cairan Sawit</h2>
              <p className="text-[11px] text-gray-400">
                Data ini akan menjadi dasar perhitungan dan rujukan uji kualitas di Lab.
              </p>
            </div>
            <span className="rounded-lg bg-[#f4f7ee] px-2.5 py-1 font-mono text-xs font-bold text-[#65a30d]">
              Role: Pengelola
            </span>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successBatch && (
            <div className="mb-5 rounded-2xl border border-[#a3e635]/40 bg-[#f7fee7] p-4 text-xs text-[#365314]">
              <div className="flex items-center gap-2 font-bold text-[#4d7c0f]">
                <CheckCircle2 className="size-4" />
                Batch Berhasil Dibuat &amp; Mengantre di Lab!
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-gray-500">Batch ID:</span>{" "}
                  <strong className="text-[#1c1d22]">{successBatch.batch_id}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Berat Bersih:</span>{" "}
                  <strong className="text-[#1c1d22]">{successBatch.berat_ton} Ton</strong>
                </div>
                <div>
                  <span className="text-gray-500">Hold Time Awal:</span>{" "}
                  <strong className="text-[#1c1d22]">{successBatch.lama_penyimpanan_jam} Jam</strong>
                </div>
                <div>
                  <span className="text-gray-500">Status Alur:</span>{" "}
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 font-sans font-bold text-amber-800">
                    {successBatch.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Batch ID Otomatis */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-600">
                  Batch ID (Dihasilkan Otomatis) <span className="text-red-500">*</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                  <Sparkles className="size-3 text-[#84cc16]" /> Auto-generated
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={form.batch_id}
                  onChange={(e) => setForm((f) => ({ ...f, batch_id: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] px-3.5 font-mono text-sm font-semibold text-[#1c1d22] outline-none transition-colors focus:border-[#a3e635] focus:bg-white"
                  placeholder="LOT-YYYYMMDD-HHMM"
                />
              </div>
            </div>

            {/* Asal Kebun */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">
                Asal Kebun / Afdeling Penyuplai <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.lokasi_kebun}
                  onChange={(e) => setForm((f) => ({ ...f, lokasi_kebun: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] pl-10 pr-3.5 text-xs text-gray-700 outline-none transition-colors focus:border-[#a3e635] focus:bg-white"
                >
                  {KEBUN_LIST.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Tanggal & Jam Panen (Input) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Jam &amp; Tanggal Panen Buah <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Input Pengelola</span>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    required
                    value={form.tanggal_panen}
                    onChange={(e) => handleTanggalPanenChange(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] pl-10 pr-3.5 text-xs text-gray-700 outline-none transition-colors focus:border-[#a3e635] focus:bg-white"
                  />
                </div>
                <span className="mt-1 block text-[10px] text-gray-400">
                  Waktu TBS dipanen dari kebun untuk perhitungan susut mutu.
                </span>
              </div>

              {/* Jam & Tanggal Masuk (Otomatis dari Perangkat) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Jam Masuk Pabrik (Otomatis Laptop) <span className="text-red-500">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#65a30d]">
                    <span className="size-1.5 rounded-full bg-[#84cc16] animate-pulse" /> Live Device Time
                  </span>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#65a30d]" />
                  <input
                    type="datetime-local"
                    readOnly
                    value={form.jam_masuk}
                    className="h-11 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100/80 pl-10 pr-3.5 font-mono text-xs font-bold text-gray-700 outline-none"
                    title="Otomatis diambil dari jam perangkat/laptop Anda"
                  />
                </div>
                <span className="mt-1 block text-[10px] text-gray-400">
                  Waktu saat ini saat bahan cair selesai diolah di stasiun press.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Berat Ton */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">
                  Berat Cairan Bersih (Ton) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Scale className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={form.berat_ton}
                    onChange={(e) => setForm((f) => ({ ...f, berat_ton: parseFloat(e.target.value) || 0 }))}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] pl-10 pr-3.5 font-mono text-sm text-gray-800 outline-none transition-colors focus:border-[#a3e635] focus:bg-white"
                    placeholder="Contoh: 25.5"
                  />
                </div>
              </div>

              {/* Hold Time (Dihitung Otomatis) */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Holding Time (Terhitung Otomatis)
                  </label>
                  <span className="rounded bg-[#f4f7ee] px-2 py-0.5 font-mono text-xs font-bold text-[#65a30d]">
                    = {form.lama_penyimpanan_jam} Jam
                  </span>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.1"
                    readOnly
                    value={form.lama_penyimpanan_jam}
                    className="h-11 w-full cursor-not-allowed rounded-xl border border-[#a3e635]/40 bg-[#fbfdf7] pl-10 pr-3.5 font-mono text-sm font-bold text-[#365314] outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-400">
                  Rumus: <code>Jam Masuk Laptop - Jam Panen</code> (otomatis dihitung).
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#84cc16] font-semibold text-[#1c1d22] shadow-sm transition-all hover:bg-[#72b012] disabled:opacity-50"
              >
                {loading ? (
                  <span>Menyimpan ke antrean Lab...</span>
                ) : (
                  <>
                    <span>Simpan &amp; Teruskan ke Lab</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informasi Alur & Panduan Pengelola */}
        <div className="space-y-6 lg:col-span-5">
          <div className="stat-card-shadow rounded-[1.75rem] bg-white p-6">
            <h3 className="text-sm font-bold text-[#1c1d22]">Petunjuk Operasional Pengelola</h3>
            <div className="mt-3 space-y-3 text-xs text-gray-600">
              <div className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#f4f7ee] font-mono text-[10px] font-bold text-[#65a30d]">
                  1
                </span>
                <p>
                  Timbang berat buah sawit / cairan CPO mentah dari stasiun press &amp; clarifier secara teliti.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#f4f7ee] font-mono text-[10px] font-bold text-[#65a30d]">
                  2
                </span>
                <p>
                  Sistem otomatis memberikan <strong>Batch ID</strong> unik untuk stiker tangki atau barcode sampel.
                </p>
              </div>
              <div className="flex gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#f4f7ee] font-mono text-[10px] font-bold text-[#65a30d]">
                  3
                </span>
                <p>
                  Status batch otomatis <code>WAITING_LAB</code> sehingga tim Lab langsung mengetahui ada sampel siap uji.
                </p>
              </div>
            </div>
          </div>

          {/* Antrean Terkini */}
          <div className="stat-card-shadow rounded-[1.75rem] bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1c1d22]">Daftar Batch Terbaru</h3>
              <Boxes className="size-4 text-gray-400" />
            </div>
            <div className="divide-y divide-gray-100">
              {recentBatches.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">Belum ada batch tercatat.</div>
              ) : (
                recentBatches.slice(0, 5).map((b, idx) => (
                  <div
                    key={b.batch_id}
                    className="py-2.5 text-xs transition-all duration-300 hover:bg-[#f8f9f6] rounded-xl px-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#1c1d22]">{b.batch_id}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
                          b.status === "WAITING_LAB"
                            ? "bg-amber-100 text-amber-800"
                            : b.status === "DISPATCHED"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-[#f4f7ee] text-[#65a30d]"
                        }`}
                      >
                        {b.status === "WAITING_LAB"
                          ? "Antre di Lab"
                          : b.status === "DISPATCHED"
                          ? "Terkirim"
                          : "Lolos Lab"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{b.berat_ton} Ton • Hold: {b.lama_penyimpanan_jam} Jam</span>
                      <span className="truncate max-w-[140px]">{b.lokasi_kebun}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
