"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FlaskConical,
  Sparkles,
  CheckCircle2,
  Clock,
  Scale,
  FileCheck,
  FileText,
  AlertCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  Info,
  X
} from "lucide-react";
import { listBatches, patchBatch, analyzeSample } from "@/lib/api-client";
import { CoaStamp } from "@/components/palm/CoaStamp";
import type { PalmBatch } from "@/lib/palm-db";
import type { PalmEvaluation } from "@/lib/palm-engine";

const COLOR_OPTIONS = [
  "Sangat Merah Kecoklatan",
  "Kuning Emas",
  "Merah Jingga",
  "Cokelat Gelap",
  "Gelap Pekat",
  "Teroksidasi Gelap",
];

export default function LabPage() {
  const [batches, setBatches] = useState<PalmBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCert, setSuccessCert] = useState<PalmBatch | null>(null);
  const [viewingCoaModal, setViewingCoaModal] = useState<PalmBatch | null>(null);

  // Form pengujian Lab
  const [labForm, setLabForm] = useState({
    pH: 6.2,
    kadar_ffa_percent: 2.1,
    moisture_percent: 0.22,
    viskositas_mPa_s: 45,
    warna: COLOR_OPTIONS[0],
    lab_analyst: "Analis Lab Utama PKS",
  });

  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());

  const loadBatches = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingList(true);
    try {
      const data = await listBatches();
      setBatches((prev) => {
        // Deteksi apakah ada batch baru yang masuk dari pengelola
        if (prev.length > 0 && data.length > prev.length) {
          const prevIds = new Set(prev.map((p) => p.batch_id));
          const newIds = data.filter((d) => !prevIds.has(d.batch_id)).map((d) => d.batch_id);
          if (newIds.length > 0) {
            setNewlyArrivedIds((old) => new Set([...old, ...newIds]));
            // Hapus efek highlight setelah 3.5 detik
            setTimeout(() => {
              setNewlyArrivedIds((current) => {
                const next = new Set(current);
                newIds.forEach((id) => next.delete(id));
                return next;
              });
            }, 3500);
          }
        }
        return data;
      });

      setSelectedBatchId((currentId) => {
        if (!currentId && data.length > 0) {
          const waiting = data.find((b) => b.status === "WAITING_LAB");
          return waiting ? waiting.batch_id : data[0].batch_id;
        }
        return currentId;
      });
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) setLoadingList(false);
    }
  }, []);

  // Polling otomatis setiap 3 detik secara silent agar data baru dari Pengelola langsung muncul
  useEffect(() => {
    loadBatches(false);
    const interval = setInterval(() => {
      loadBatches(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadBatches]);

  const selectedBatch = batches.find((b) => b.batch_id === selectedBatchId);

  // Auto-fill form jika batch yang dipilih sudah pernah dites sebelumnya
  useEffect(() => {
    if (selectedBatch && selectedBatch.kadar_ffa_percent > 0) {
      setLabForm((f) => ({
        ...f,
        pH: selectedBatch.pH || 6.2,
        kadar_ffa_percent: selectedBatch.kadar_ffa_percent || 2.1,
        moisture_percent: selectedBatch.moisture_percent || 0.2,
        viskositas_mPa_s: selectedBatch.viskositas_mPa_s || 45,
        warna: selectedBatch.warna || COLOR_OPTIONS[0],
      }));
    }
  }, [selectedBatch]);

  const handleSubmitLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessCert(null);

    try {
      // 1. Jalankan Evaluasi AI / Python Engine dengan data rujukan (berat & hold time) + parameter lab
      const evalResult: PalmEvaluation = await analyzeSample({
        batch_id: selectedBatch.batch_id,
        lokasi_kebun: selectedBatch.lokasi_kebun,
        tanggal_panen: selectedBatch.tanggal_panen || selectedBatch.jam_masuk,
        lama_penyimpanan_jam: selectedBatch.lama_penyimpanan_jam,
        berat_ton: selectedBatch.berat_ton,
        pH: Number(labForm.pH),
        kadar_ffa_percent: Number(labForm.kadar_ffa_percent),
        moisture_percent: Number(labForm.moisture_percent),
        viskositas_mPa_s: Number(labForm.viskositas_mPa_s),
        warna: labForm.warna,
      });

      // 2. Terbitkan Surat Lab / Certificate of Analysis (COA)
      const certNo = `COA/LAB/${new Date().getFullYear()}/${selectedBatch.batch_id.replace("LOT-", "")}`;
      const patchData: Partial<PalmBatch> = {
        pH: Number(labForm.pH),
        kadar_ffa_percent: Number(labForm.kadar_ffa_percent),
        moisture_percent: Number(labForm.moisture_percent),
        viskositas_mPa_s: Number(labForm.viskositas_mPa_s),
        warna: labForm.warna,
        track_type: evalResult.track_type,
        category: evalResult.category,
        primary_recommendation: evalResult.primary_recommendation,
        alternate_recommendation: evalResult.alternate_recommendation,
        confidence_score: evalResult.confidence_score,
        ai_explanation: evalResult.ai_explanation,
        action_steps: evalResult.action_steps,
        status: "READY_WAREHOUSE",
        lab_tested_at: new Date().toISOString(),
        lab_analyst: labForm.lab_analyst,
        lab_certificate_no: certNo,
        details: evalResult.details,
      };

      const res = await patchBatch(selectedBatch.batch_id, patchData);
      setSuccessCert(res.data);
      await loadBatches();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info */}
      <div className="stat-card-shadow flex flex-col justify-between gap-4 rounded-[1.75rem] bg-gradient-to-r from-[#1c1d22] to-[#252836] p-6 text-white md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
            <FlaskConical className="size-3.5" />
            Quality Control &amp; Sertifikasi Lab PKS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Pengujian Kualitas &amp; Penerbitan Surat Uji Mutu (COA)
          </h1>
          <p className="text-xs text-gray-400">
            Gunakan berat dan holding time dari Pengelola sebagai acuan pengujian, masukkan hasil lab (pH, FFA, dll), dan terbitkan surat analisis AI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Antrean Batch dari Pengelola */}
        <div className="stat-card-shadow rounded-[1.75rem] bg-white p-5 lg:col-span-4">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#1c1d22]">Antrean Sampel Masuk</h2>
              <p className="text-[10px] text-gray-400">Pilih batch untuk input hasil uji lab</p>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-bold text-gray-600">
              {batches.length} Batch
            </span>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {loadingList ? (
              <div className="py-8 text-center text-xs text-gray-400">Memuat antrean...</div>
            ) : batches.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">Belum ada batch dari pengelola.</div>
            ) : (
              batches.map((b) => {
                const isSelected = b.batch_id === selectedBatchId;
                const isWaiting = b.status === "WAITING_LAB";
                const isNewlyArrived = newlyArrivedIds.has(b.batch_id);
                return (
                  <button
                    key={b.batch_id}
                    type="button"
                    onClick={() => {
                      setSelectedBatchId(b.batch_id);
                      setSuccessCert(null);
                    }}
                    className={`w-full rounded-2xl p-3.5 text-left transition-all duration-300 ${
                      isNewlyArrived ? "animate-slide-down animate-highlight-new ring-2 ring-[#84cc16]" : ""
                    } ${
                      isSelected
                        ? "bg-[#1c1d22] text-white shadow-md ring-2 ring-[#84cc16]"
                        : "bg-[#f8f9f6] text-gray-800 hover:bg-gray-100 hover:translate-x-1"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isNewlyArrived && (
                          <span className="flex size-2 rounded-full bg-[#84cc16] animate-ping" />
                        )}
                        <span className="font-mono text-xs font-bold">{b.batch_id}</span>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
                          isWaiting
                            ? isSelected
                              ? "bg-amber-400 text-black"
                              : "bg-amber-100 text-amber-800"
                            : isSelected
                            ? "bg-white/20 text-[#a3e635]"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isWaiting ? "Menunggu Uji" : "Selesai Uji"}
                      </span>
                    </div>

                    <div className={`mt-2 grid grid-cols-2 gap-1 text-[11px] ${isSelected ? "text-gray-300" : "text-gray-500"}`}>
                      <div>
                        Berat: <strong className={isSelected ? "text-white" : "text-gray-700"}>{b.berat_ton} t</strong>
                      </div>
                      <div>
                        Hold: <strong className={isSelected ? "text-white" : "text-gray-700"}>{b.lama_penyimpanan_jam} jam</strong>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Input Parameter Lab & Penerbitan Surat */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card Data Acuan Pengujian */}
          {selectedBatch ? (
            <div className="stat-card-shadow rounded-[1.75rem] border border-[#a3e635]/30 bg-[#fbfdf7] p-5">
              <div className="flex items-center gap-2 font-bold text-[#365314]">
                <Info className="size-4 text-[#65a30d]" />
                Acuan Pengujian dari Pengelola
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs font-mono">
                <div className="rounded-xl bg-white p-2.5 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-sans">Batch ID</span>
                  <strong className="text-[#1c1d22]">{selectedBatch.batch_id}</strong>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-sans">Berat Cairan</span>
                  <strong className="text-[#1c1d22]">{selectedBatch.berat_ton} Ton</strong>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-sans">Holding Time</span>
                  <strong className="text-[#1c1d22]">{selectedBatch.lama_penyimpanan_jam} Jam</strong>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-sans">Asal Kebun</span>
                  <strong className="text-[#1c1d22] truncate block">{selectedBatch.lokasi_kebun}</strong>
                </div>
              </div>

              {/* Jika batch ini sudah rilis surat COA / selesai diuji lab */}
              {selectedBatch.status !== "WAITING_LAB" && selectedBatch.kadar_ffa_percent > 0 && (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-[#65a30d]" />
                      <span className="text-xs font-bold text-[#1c1d22]">
                        Surat Hasil Uji (COA) Telah Terbit
                      </span>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                        {selectedBatch.lab_certificate_no || `COA/LAB/2026/${selectedBatch.batch_id}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingCoaModal(selectedBatch)}
                      className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-[#84cc16] px-3.5 py-1.5 text-xs font-bold text-[#1c1d22] hover:bg-[#73b313] transition-colors shadow-sm"
                    >
                      <FileText className="size-3.5" />
                      <span>Lihat Dokumen COA</span>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-[#f8faf2] p-3 border border-[#a3e635]/30">
                      <span className="text-[10px] uppercase font-bold text-[#4d7c0f] block">
                        Rekomendasi Utama (Primary):
                      </span>
                      <strong className="mt-0.5 block text-xs text-[#1c1d22]">
                        {selectedBatch.primary_recommendation}
                      </strong>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">
                        Rekomendasi Alternatif:
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-700">
                        {selectedBatch.alternate_recommendation || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Form Input Lab */}
          <div className="stat-card-shadow rounded-[1.75rem] bg-white p-6">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#1c1d22]">Formulir Uji Fisika-Kimia Lab</h2>
              <span className="rounded-lg bg-[#f4f7ee] px-2.5 py-1 font-mono text-xs font-bold text-[#65a30d]">
                Role: Lab / QC
              </span>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Jika Sukses Terbitkan Surat */}
            {successCert && (
              <div className="mb-6 rounded-2xl border-2 border-[#84cc16] bg-[#f8faf2] p-5 text-xs text-[#1c1d22]">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2 font-bold text-[#4d7c0f]">
                    <ShieldCheck className="size-5 text-[#65a30d]" />
                    <span>Surat Hasil Uji Lab (COA) Telah Diterbitkan!</span>
                  </div>
                  <span className="font-mono font-bold text-gray-700">{successCert.lab_certificate_no}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Kategori Mutu:</span>{" "}
                    <strong className="text-[#65a30d] font-bold">{successCert.category}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Keyakinan AI:</span>{" "}
                    <strong className="text-emerald-700">{successCert.confidence_score}%</strong>
                  </div>
                  <div className="col-span-2 rounded-xl bg-white p-3.5 border border-gray-100 shadow-sm space-y-2">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Rekomendasi Utama:</span>
                      <strong className="text-xs text-[#1c1d22]">{successCert.primary_recommendation}</strong>
                    </div>
                    {successCert.alternate_recommendation && successCert.alternate_recommendation !== "-" && (
                      <div className="border-t border-gray-100 pt-1.5">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Rekomendasi Alternatif:</span>
                        <span className="text-xs text-gray-700">{successCert.alternate_recommendation}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-1.5">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Analisis AI:</span>
                      <p className="mt-0.5 text-xs text-gray-600 italic">{successCert.ai_explanation}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-gray-500">
                    Data diteruskan ke <strong>Gudang</strong> untuk alokasi tangki dan distribusi FIFO.
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewingCoaModal(successCert)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#84cc16] px-3.5 py-1.5 text-xs font-bold text-[#1c1d22] hover:bg-[#73b313] transition-colors"
                  >
                    <FileText className="size-3.5" />
                    <span>Lihat Dokumen COA</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitLab} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Kadar FFA */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                    Kadar FFA (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="100"
                    required
                    value={labForm.kadar_ffa_percent}
                    onChange={(e) => setLabForm((f) => ({ ...f, kadar_ffa_percent: parseFloat(e.target.value) || 0 }))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] px-3.5 font-mono text-sm text-gray-800 outline-none focus:border-[#a3e635] focus:bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Standar Super CPO &le; 3%, Bio &gt; 3%</span>
                </div>

                {/* pH */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                    pH Larutan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="14"
                    required
                    value={labForm.pH}
                    onChange={(e) => setLabForm((f) => ({ ...f, pH: parseFloat(e.target.value) || 0 }))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] px-3.5 font-mono text-sm text-gray-800 outline-none focus:border-[#a3e635] focus:bg-white"
                  />
                  <span className="text-[10px] text-gray-400">Ideal CPO: 6.0 – 7.2</span>
                </div>

                {/* Moisture % */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                    Kadar Air / Moisture (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={labForm.moisture_percent}
                    onChange={(e) => setLabForm((f) => ({ ...f, moisture_percent: parseFloat(e.target.value) || 0 }))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] px-3.5 font-mono text-sm text-gray-800 outline-none focus:border-[#a3e635] focus:bg-white"
                  />
                </div>

                {/* Viskositas */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                    Viskositas Dinamis (mPa·s)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={labForm.viskositas_mPa_s}
                    onChange={(e) => setLabForm((f) => ({ ...f, viskositas_mPa_s: parseFloat(e.target.value) || 0 }))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] px-3.5 font-mono text-sm text-gray-800 outline-none focus:border-[#a3e635] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Warna Sampel */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                    Warna / Visual Sampel
                  </label>
                  <select
                    value={labForm.warna}
                    onChange={(e) => setLabForm((f) => ({ ...f, warna: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] px-3 text-xs text-gray-700 outline-none focus:border-[#a3e635] focus:bg-white"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nama Analis */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-600">
                    Nama Analis Lab Penguji
                  </label>
                  <input
                    type="text"
                    required
                    value={labForm.lab_analyst}
                    onChange={(e) => setLabForm((f) => ({ ...f, lab_analyst: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] px-3.5 text-xs text-gray-800 outline-none focus:border-[#a3e635] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting || !selectedBatch}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1c1d22] font-semibold text-white shadow-sm transition-all hover:bg-black disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Mengevaluasi AI &amp; Menerbitkan COA...</span>
                  ) : (
                    <>
                      <FileCheck className="size-4 text-[#a3e635]" />
                      <span>Uji Mutu &amp; Terbitkan Surat Lab (COA)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Surat Lab (COA) Preview */}
      {viewingCoaModal && (
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
                    No: {viewingCoaModal.lab_certificate_no || `COA/LAB/2026/${viewingCoaModal.batch_id}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCoaModal(null)}
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
                  <strong className="text-sm text-[#1c1d22]">{viewingCoaModal.batch_id}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Tonase Cairan</span>
                  <strong className="text-sm text-[#1c1d22]">{viewingCoaModal.berat_ton} Ton</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Holding Time Sebelum Lab</span>
                  <strong>{viewingCoaModal.lama_penyimpanan_jam} Jam</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Asal Kebun</span>
                  <strong>{viewingCoaModal.lokasi_kebun}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Tanggal Uji Lab</span>
                  <strong>{viewingCoaModal.lab_tested_at || viewingCoaModal.created_at}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block font-sans">Analis Lab</span>
                  <strong>{viewingCoaModal.lab_analyst || "Lab Tim Sawight PKS"}</strong>
                </div>
              </div>

              {/* Tabel Parameter Uji */}
              <div>
                <h4 className="font-bold text-[#1c1d22] mb-2">Parameter Fisika-Kimia Terverifikasi:</h4>
                <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                  <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <span className="text-[10px] text-gray-400 block">Kadar FFA</span>
                    <strong className="text-base text-[#65a30d]">{viewingCoaModal.kadar_ffa_percent}%</strong>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <span className="text-[10px] text-gray-400 block">pH Sampel</span>
                    <strong className="text-base text-[#1c1d22]">{viewingCoaModal.pH}</strong>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <span className="text-[10px] text-gray-400 block">Moisture</span>
                    <strong className="text-base text-[#1c1d22]">{viewingCoaModal.moisture_percent}%</strong>
                  </div>
                </div>
              </div>

              {/* Keputusan Alokasi */}
              <div className="rounded-2xl border border-[#a3e635]/40 bg-[#f7fee7] p-4 text-[#365314] space-y-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#4d7c0f] block">
                    Rekomendasi Utama (Primary):
                  </span>
                  <div className="mt-0.5 font-bold text-sm text-[#1c1d22]">
                    {viewingCoaModal.primary_recommendation}
                  </div>
                </div>

                {viewingCoaModal.alternate_recommendation && viewingCoaModal.alternate_recommendation !== "-" && (
                  <div className="border-t border-[#a3e635]/30 pt-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">
                      Rekomendasi Alternatif:
                    </span>
                    <div className="mt-0.5 font-semibold text-xs text-gray-800">
                      {viewingCoaModal.alternate_recommendation}
                    </div>
                  </div>
                )}

                <div className="border-t border-[#a3e635]/30 pt-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Penjelasan Analisis Mutu AI:
                  </span>
                  <p className="mt-0.5 text-xs italic text-gray-700">{viewingCoaModal.ai_explanation}</p>
                </div>
              </div>

              {/* Cap Stempel Resmi & Pengesahan Analis */}
              <CoaStamp
                analystName={viewingCoaModal.lab_analyst || "Dr. Siti Rahma (QC Head)"}
                testedAt={viewingCoaModal.lab_tested_at || viewingCoaModal.created_at}
                certNo={viewingCoaModal.lab_certificate_no}
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
                onClick={() => setViewingCoaModal(null)}
                className="rounded-xl bg-[#1c1d22] px-5 py-2 text-xs font-bold text-white hover:bg-black"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
