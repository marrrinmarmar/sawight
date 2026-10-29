"use client";

import { PALM_THRESHOLDS } from "@/lib/palm-engine";

const matrixRows = [
  { standar: "CPO Pangan (Default)", ffa: "≤ 5.0%", ph: `${PALM_THRESHOLDS.DEFAULT_MIN_PH} – ${PALM_THRESHOLDS.DEFAULT_MAX_PH}`, simpan: "≤ 24 jam", warna: "Sangat Merah / Kuning Emas", tujuan: "Cooking Oil SNI 7709 / PORAM" },
  { standar: "Renewable Diesel HVO", ffa: "≤ 6.0%", ph: "≥ 5.6", simpan: "≤ 65 jam", warna: "Moisture ≤ 0.40%", tujuan: "Green Diesel & SAF" },
  { standar: "Biodiesel FAME", ffa: "≤ 15.0%", ph: "≥ 4.9", simpan: "≤ 65 jam", warna: "Sub-kriteria bio", tujuan: "Mandat B35 / B40" },
  { standar: "Bioplastik PHA", ffa: "≤ 15.0%", ph: "≥ 4.9", simpan: "≤ 65 jam", warna: "Viskositas ≥ 65 mPa.s", tujuan: "Polimer terurai 100%" },
  { standar: "Oleokimia Industri", ffa: "≤ 18.0%", ph: "≥ 4.6", simpan: "> 65 jam", warna: "Teroksidasi", tujuan: "Fatty Acid Splitting" },
  { standar: "Pakan Ternak", ffa: "≤ 22.0%", ph: "≥ 4.3", simpan: "> 65 jam", warna: "Teroksidasi pekat", tujuan: "Calcium Soap / Bypass Fat" },
  { standar: "Pupuk / Biogas", ffa: "> 22.0%", ph: "< 4.3", simpan: "> 89 jam", warna: "Degradasi berat", tujuan: "Biogas metana & kompos" },
];

export function ThresholdMatrix() {
  return (
    <div className="stat-card-shadow overflow-hidden rounded-[1.5rem] bg-white p-5">
      <h3 className="text-base font-bold tracking-tight text-[#1c1d22]">
        Matriks Ambang Batas Ilmiah &amp; Regulasi
      </h3>
      <p className="mt-0.5 text-[11px] text-gray-400">
        Threshold evaluasi mutu biokimia yang dipakai oleh decision engine.
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <th className="px-2 py-2.5">Track / Standar</th>
              <th className="px-2 py-2.5">FFA</th>
              <th className="px-2 py-2.5">pH</th>
              <th className="px-2 py-2.5">Hold Time</th>
              <th className="px-2 py-2.5">Kondisi Fisik</th>
              <th className="px-2 py-2.5">Tujuan Hilirisasi</th>
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((r) => (
              <tr key={r.standar} className="border-b border-gray-50 text-[11px] text-gray-700">
                <td className="px-2 py-2.5 font-bold text-[#1c1d22]">{r.standar}</td>
                <td className="px-2 py-2.5 font-mono">{r.ffa}</td>
                <td className="px-2 py-2.5 font-mono">{r.ph}</td>
                <td className="px-2 py-2.5 font-mono">{r.simpan}</td>
                <td className="px-2 py-2.5">{r.warna}</td>
                <td className="px-2 py-2.5 text-gray-500">{r.tujuan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
