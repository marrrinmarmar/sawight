"use client";

import { Activity, Cpu, Database, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* Status Engine Full Python & Database */}
      <div className="stat-card-shadow rounded-[1.5rem] bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2e2]">
            <Cpu className="size-4.5 text-[#65a30d]" />
          </span>
          <h2 className="text-base font-bold tracking-tight text-[#1c1d22]">
            Konfigurasi Sistem &amp; AI Engine
          </h2>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          Sistem saat ini beroperasi menggunakan <b>Full Python Real Report &amp; ML Architecture</b> yang terhubung langsung ke database PostgreSQL lokal/remote.
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#f8f9f6] p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-700">
                <Activity className="size-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[#1c1d22]">Python AI &amp; Real Report Engine</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                  FastAPI backend di port 8000. Mengkalkulasi alokasi mutu, estimasi valuasi (IDR), dan reduksi emisi CO2 secara deterministik &amp; presisi.
                </p>
              </div>
            </div>
            <span className="mt-0.5 shrink-0 rounded-full bg-[#eef2e2] px-2.5 py-0.5 text-[9px] font-bold uppercase text-[#65a30d]">
              AKTIF
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#f8f9f6] p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-700">
                <Database className="size-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-[#1c1d22]">PostgreSQL Persistence</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                  Tabel <code>palm_batches</code> tersinkronisasi otomatis untuk setiap analisis sampel baru.
                </p>
              </div>
            </div>
            <span className="mt-0.5 shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase text-blue-600">
              TERHUBUNG
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[#f2f4ef] p-3 text-[11px] leading-relaxed text-gray-500">
          <b>Batch ID Generator:</b> Sistem menggunakan penomoran otomatis terstandar <code>LOT-YYYYMMDD-HHMM</code> tanpa memerlukan inputan manual operator.
        </div>
      </div>

      {/* Standar Acuan Regulasi Industri */}
      <div className="stat-card-shadow rounded-[1.5rem] bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <ShieldCheck className="size-4.5 text-violet-500" />
          </span>
          <h2 className="text-base font-bold tracking-tight text-[#1c1d22]">
            Standar Acuan Regulasi Pabrik
          </h2>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
          Parameter klasifikasi dan formula kimia mutu diatur berdasarkan standar resmi industri kelapa sawit nasional &amp; internasional.
        </p>

        <div className="mt-4 space-y-2.5">
          <div className="rounded-xl border border-gray-100 bg-[#f8f9f6] p-3">
            <p className="text-xs font-bold text-[#1c1d22]">SNI 7709:2019 — Minyak Goreng Sawit</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Kadar FFA ≤ 2.5%, hold time ≤ 16 jam, pH 5.5 - 6.8 untuk konsumsi Grade A.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-[#f8f9f6] p-3">
            <p className="text-xs font-bold text-[#1c1d22]">PORAM Standard — Crude Palm Oil Ekspor</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Batas ambang FFA CPO standar pangan ≤ 5.0%, kadar air ≤ 0.25%.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-[#f8f9f6] p-3">
            <p className="text-xs font-bold text-[#1c1d22]">SNI 7182 &amp; Mandat Biofuel B35/B40</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Spesifikasi Fatty Acid Methyl Ester (FAME) dan Renewable Diesel (HVO).
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-[#f8f9f6] p-3">
            <p className="text-xs font-bold text-[#1c1d22]">ISPO / ISCC GHG Accounting</p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Kalkulasi jejak karbon dan potensi dekarbonisasi industri hilir sawit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
