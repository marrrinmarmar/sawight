"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  FlaskConical,
  Leaf,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { analyzeSample, createBatch } from "@/lib/api-client";
import { formatRupiah, type PalmEvaluation, type PalmParams } from "@/lib/palm-engine";

const COLOR_OPTIONS = [
  "Sangat Merah Kecoklatan",
  "Kuning Emas",
  "Merah Jingga",
  "Cokelat Gelap",
  "Gelap Pekat",
  "Teroksidasi Gelap",
];

const CATEGORY_LABEL: Record<string, string> = {
  CPO_DEFAULT: "CPO Pangan (Default Track)",
  BIO_ECO_FRIENDLY: "Produk Bio / Eco-Friendly",
  OTHER_PRODUCTS: "Produk Lainnya (Non-Bio)",
};

const CATEGORY_STYLE: Record<string, string> = {
  CPO_DEFAULT: "bg-[#eef2e2] text-[#65a30d]",
  BIO_ECO_FRIENDLY: "bg-blue-50 text-blue-600",
  OTHER_PRODUCTS: "bg-orange-50 text-orange-600",
};

const inputCls =
  "h-10 w-full rounded-xl border border-gray-100 bg-[#f8f9f6] px-3.5 text-sm text-gray-700 outline-none transition-colors focus:border-[#a3e635] focus:bg-white";

const labelCls = "mb-1.5 block text-[11px] font-semibold text-gray-500";

export default function SimulatorPage() {
  const [form, setForm] = useState({
    batch_id: "",
    lokasi_kebun: "Kebun Riau Afdeling 1 - Blok A-08",
    tanggal_panen: "", // filled client-side (dynamic value)
    lama_penyimpanan_jam: 12,
    warna: COLOR_OPTIONS[0],
    viskositas_mPa_s: 45,
    pH: 6.2,
    kadar_ffa_percent: 2.1,
    moisture_percent: 0.2,
    berat_ton: 25,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PalmEvaluation | null>(null);

  // Inisialisasi default batch_id dan waktu panen
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    set("tanggal_panen", now.toISOString().slice(0, 16));

    // Generate batch_id standar: LOT-YYYYMMDD-HHMM
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");
    set("batch_id", `LOT-${dateStr}-${timeStr}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const params: PalmParams = useMemo(
    () => ({
      batch_id: form.batch_id.trim() || undefined,
      lokasi_kebun: form.lokasi_kebun,
      tanggal_panen: form.tanggal_panen
        ? new Date(form.tanggal_panen).toISOString()
        : undefined,
      lama_penyimpanan_jam: form.lama_penyimpanan_jam,
      warna: form.warna,
      viskositas_mPa_s: form.viskositas_mPa_s,
      pH: form.pH,
      kadar_ffa_percent: form.kadar_ffa_percent,
      moisture_percent: form.moisture_percent,
      berat_ton: form.berat_ton,
    }),
    [form]
  );

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setSavedMsg(null);
    setResult(null);
    try {
      const geminiKey = localStorage.getItem("palmqual_gemini_key") || undefined;
      const data = await analyzeSample(params, geminiKey);
      setResult(data);
      // Sinkronkan form batch_id dengan ID hasil evaluasi
      if (data.batch_id && data.batch_id !== form.batch_id) {
        set("batch_id", data.batch_id);
      }
    } catch (err) {
      setErrorMsg(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  }, [params, form.batch_id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const geminiKey = localStorage.getItem("palmqual_gemini_key") || undefined;
      // Gunakan batch_id persis yang tertera di kartu hasil evaluasi
      const payloadToSave = {
        ...params,
        batch_id: result?.batch_id || params.batch_id,
      };
      const res = await createBatch(payloadToSave, geminiKey);
      setSavedMsg(res.message);
    } catch (err) {
      setErrorMsg(String(err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  }, [params, result]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.25fr]">
      {/* ============ FORM: Pengujian Sampel Masuk Baru ============ */}
      <div className="stat-card-shadow h-fit rounded-[1.5rem] bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2e2]">
            <FlaskConical className="size-4 text-[#65a30d]" />
          </span>
          <h2 className="text-base font-bold tracking-tight text-[#1c1d22]">
            Pengujian Sampel Masuk Baru
          </h2>
        </div>
        <p className="mt-1 text-[11px] text-gray-400">
          Masukkan parameter fisik &amp; kimia sampel untuk evaluasi track alokasi.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className={labelCls}>Batch ID (opsional)</label>
            <input
              className={inputCls}
              value={form.batch_id}
              onChange={(e) => set("batch_id", e.target.value)}
              placeholder="LOT-20261029-09"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Lokasi Kebun / Blok</label>
            <input
              className={inputCls}
              value={form.lokasi_kebun}
              onChange={(e) => set("lokasi_kebun", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Waktu Panen</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.tanggal_panen}
              onChange={(e) => set("tanggal_panen", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Hold Time (jam)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              className={inputCls}
              value={form.lama_penyimpanan_jam}
              onChange={(e) => set("lama_penyimpanan_jam", Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Warna Sampel</label>
            <select
              className={inputCls}
              value={form.warna}
              onChange={(e) => set("warna", e.target.value)}
            >
              {COLOR_OPTIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Viskositas (mPa.s)</label>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={form.viskositas_mPa_s}
              onChange={(e) => set("viskositas_mPa_s", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>pH</label>
            <input
              type="number"
              step="0.05"
              className={inputCls}
              value={form.pH}
              onChange={(e) => set("pH", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Kadar FFA (%)</label>
            <input
              type="number"
              step="0.05"
              className={inputCls}
              value={form.kadar_ffa_percent}
              onChange={(e) => set("kadar_ffa_percent", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Moisture (%)</label>
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.moisture_percent}
              onChange={(e) => set("moisture_percent", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelCls}>Berat Lot (ton)</label>
            <input
              type="number"
              step="0.5"
              className={inputCls}
              value={form.berat_ton}
              onChange={(e) => set("berat_ton", Number(e.target.value))}
            />
          </div>

          <div className="mt-1 flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1c1d22] text-sm font-bold text-white transition-colors hover:bg-black disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Menganalisis...
                </>
              ) : (
                <>
                  <Sparkles className="size-4 text-[#a3e635]" /> Analisis Sampel
                </>
              )}
            </button>
          </div>
          {errorMsg && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500 sm:col-span-2">
              {errorMsg}
            </p>
          )}
        </form>
      </div>

      {/* ============ HASIL ============ */}
      <div className="flex flex-col gap-4">
        {!result && (
          <div className="stat-card-shadow flex min-h-64 flex-col items-center justify-center rounded-[1.5rem] bg-white p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2e2]">
              <Leaf className="size-7 text-[#84cc16]" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-sm font-bold text-[#1c1d22]">Belum ada hasil evaluasi</p>
            <p className="mt-1 max-w-xs text-xs text-gray-400">
              Isi parameter di form sebelah kiri lalu klik <b>Analisis Sampel</b>. Sistem akan
              menilai track alokasi: CPO Pangan, Bio/Eco-Friendly, atau Produk Lainnya.
            </p>
          </div>
        )}

        {result && (
          <>
            {/* Verdict card */}
            <div className="stat-card-shadow rounded-[1.5rem] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      CATEGORY_STYLE[result.category]
                    }`}
                  >
                    {CATEGORY_LABEL[result.category]}
                  </span>
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">
                    Track {result.track_type}
                  </span>
                  {result.details.engine_mode?.includes("Python") && (
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                      Python AI Engine
                    </span>
                  )}
                  {result.details.engine_mode?.includes("Gemini") && (
                    <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-600">
                      Gemini AI
                    </span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-gray-400">{result.batch_id}</p>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Rekomendasi Utama
                </p>
                <p className="mt-1 text-base font-bold leading-snug text-[#1c1d22]">
                  {result.primary_recommendation}
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Alternatif
                </p>
                <p className="mt-1 text-xs text-gray-600">{result.alternate_recommendation}</p>
              </div>

              {/* Telemetry */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[#f8f9f6] p-3 text-center">
                  <p className="text-lg font-bold text-[#1c1d22]">
                    {Number(result.confidence_score).toFixed(1)}%
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    Indeks Keyakinan
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f8f9f6] p-3 text-center">
                  <p className="text-lg font-bold text-[#1c1d22]">
                    {formatRupiah(result.details.estimated_value_idr)}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    Estimasi Valuasi
                  </p>
                </div>
                <div className="rounded-2xl bg-[#f8f9f6] p-3 text-center">
                  <p className="text-lg font-bold text-[#65a30d]">
                    {result.details.co2_reduction_kg.toLocaleString("id-ID")} kg
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    Potensi Emisi (-)
                  </p>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-[#f2f4ef] p-3.5 text-[11px] leading-relaxed text-gray-600">
                {result.ai_explanation}
              </p>

              <ol className="mt-3 space-y-1.5">
                {result.action_steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-[11px] leading-relaxed text-gray-600">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#eef2e2] font-mono text-[9px] font-bold text-[#65a30d]">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex h-10 items-center gap-2 rounded-xl bg-[#84cc16] px-4 text-xs font-bold text-white transition-colors hover:bg-[#65a30d] disabled:opacity-60"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Simpan ke Inventaris
                </button>
                <Link
                  href="/batches"
                  className="flex h-10 items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800"
                >
                  Lihat Inventaris <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
              {savedMsg && (
                <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#eef2e2] px-3 py-2 text-xs font-semibold text-[#65a30d]">
                  <BadgeCheck className="size-4" /> {savedMsg}
                </p>
              )}
            </div>

            {/* Dokumen Surat Keputusan */}
            <div className="stat-card-shadow rounded-[1.5rem] bg-white p-6">
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    PalmQual-AI · Bio-Refinery Nasional
                  </p>
                  <h3 className="mt-3 max-w-xs mx-auto font-extrabold uppercase leading-snug tracking-tight text-[#1c1d22]">
                    Surat Keputusan Alokasi Bahan Baku
                  </h3>
                  <p className="mt-1 font-mono text-[10px] text-gray-400">
                    Nomor: PQ/{result.track_type}/{new Date().getFullYear()}/
                    {result.batch_id.replace(/[^0-9]/g, "").slice(-6) || "000000"}
                  </p>
                </div>

                <div className="mt-5 space-y-2.5 rounded-xl bg-[#f8f9f6] p-4 text-[11px] text-gray-600">
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 font-semibold text-gray-400">Batch ID</span>
                    <span className="font-mono font-bold text-[#1c1d22]">{result.batch_id}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 font-semibold text-gray-400">Lokasi Kebun</span>
                    <span>{result.details.lokasi_kebun}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 font-semibold text-gray-400">Tonase Lot</span>
                    <span className="font-mono">{result.details.berat_ton} ton</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 font-semibold text-gray-400">Hold Time</span>
                    <span className="font-mono">{result.details.lama_penyimpanan_jam} jam</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-28 shrink-0 font-semibold text-gray-400">FFA / pH</span>
                    <span className="font-mono">
                      {result.details.kadar_ffa_percent}% / {result.details.pH}
                    </span>
                  </div>
                  <div className="mt-1 border-t border-gray-100 pt-2.5">
                    <p className="font-semibold text-gray-400">MEMUTUSKAN:</p>
                    <p className="mt-1 font-bold text-[#1c1d22]">
                      Menetapkan alokasi bahan baku lot di atas untuk{" "}
                      {result.primary_recommendation}, dengan jalur alternatif{" "}
                      {result.alternate_recommendation}.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#65a30d]">
                    <BadgeCheck className="size-4" /> Quality Certificate: PASS
                  </div>
                  <div className="text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#84cc16] text-[9px] font-black leading-tight text-[#65a30d]">
                      PQ·AI
                      <br />
                      VERIFIED
                    </div>
                    <p className="mt-1 text-[9px] text-gray-400">
                      Diterbitkan{" "}
                      {new Date(result.details.evaluated_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
