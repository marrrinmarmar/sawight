"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, KeyRound, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGeminiKey(localStorage.getItem("palmqual_gemini_key") || "");
  }, []);

  const handleSave = () => {
    if (geminiKey.trim()) {
      localStorage.setItem("palmqual_gemini_key", geminiKey.trim());
    } else {
      localStorage.removeItem("palmqual_gemini_key");
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* Konfigurasi Model & Gemini API */}
      <div className="stat-card-shadow rounded-[1.5rem] bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2e2]">
            <KeyRound className="size-4.5 text-[#65a30d]" />
          </span>
          <h2 className="text-base font-bold tracking-tight text-[#1c1d22]">
            Konfigurasi Model &amp; Gemini API
          </h2>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
          Google Gemini API Key <b>(opsional)</b>. Jika kosong, sistem otomatis menjalankan{" "}
          <b>Rule-Based Engine</b> deterministik dengan presisi tinggi.
        </p>

        <label className="mb-1.5 mt-4 block text-[11px] font-semibold text-gray-500">
          Gemini API Key
        </label>
        <input
          type="password"
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
          placeholder="AIza..."
          className="h-10 w-full rounded-xl border border-gray-100 bg-[#f8f9f6] px-3.5 font-mono text-sm text-gray-700 outline-none transition-colors focus:border-[#a3e635] focus:bg-white"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#1c1d22] px-4 text-xs font-bold text-white transition-colors hover:bg-black"
          >
            Simpan Konfigurasi
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#65a30d]">
              <BadgeCheck className="size-4" /> Tersimpan di perangkat ini
            </span>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-[#f2f4ef] p-3 text-[11px] leading-relaxed text-gray-500">
          <b>Mechanism:</b> key disimpan di <code>localStorage</code> browser (tidak pernah
          dikirim ke mana pun selain endpoint evaluasi). Alternatif: set env{" "}
          <code>GEMINI_API_KEY</code> pada server untuk mode AI default semua pengguna.
        </div>
      </div>

      {/* Mode Evaluasi Mutu */}
      <div className="stat-card-shadow rounded-[1.5rem] bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <ShieldCheck className="size-4.5 text-violet-500" />
          </span>
          <h2 className="text-base font-bold tracking-tight text-[#1c1d22]">
            Mode Evaluasi Mutu
          </h2>
        </div>

        <div className="mt-3 space-y-3">
          {[
            {
              title: "Rule-Based Engine (Aktif — Default)",
              desc: "Klasifikasi deterministik berbasis ambang batas ilmiah: FFA, pH, moisture, viskositas, hold time. Selalu tersedia, tanpa biaya.",
              active: true,
            },
            {
              title: "Gemini AI Deep Analysis (Aktif bila key tersedia)",
              desc: "Structured output JSON via gemini-3.8-flash untuk reasoning kasus deviasi kompleks; fallback otomatis ke Rule-Based saat gagal.",
              active: !!geminiKey,
            },
          ].map((m) => (
            <div
              key={m.title}
              className="flex items-start justify-between gap-3 rounded-2xl bg-[#f8f9f6] p-4"
            >
              <div>
                <p className="text-xs font-bold text-[#1c1d22]">{m.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{m.desc}</p>
              </div>
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                  m.active ? "bg-[#eef2e2] text-[#65a30d]" : "bg-gray-100 text-gray-400"
                }`}
              >
                {m.active ? "ON" : "OFF"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Standar Acuan Regulasi
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-gray-500">
            <li>• SNI 7709 — Minyak sawit konsumsi (Cooking Oil Grade A)</li>
            <li>• PORAM Standard — Spesifikasi ekspor Crude Palm Oil</li>
            <li>• SNI 7182 — Biodiesel FAME (mandat campuran B35/B40)</li>
            <li>• ISPO/ISCC — Keberlanjutan &amp; akuntansi emisi karbon</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
