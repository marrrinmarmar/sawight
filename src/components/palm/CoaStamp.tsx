"use client";

import { ShieldCheck, CheckCircle2, Award } from "lucide-react";

interface CoaStampProps {
  analystName?: string;
  testedAt?: string;
  certNo?: string;
  statusText?: string;
}

export function CoaStamp({
  analystName = "Tim Lab PKS Sawight",
  testedAt,
  certNo,
  statusText = "MUTU TERVERIFIKASI",
}: CoaStampProps) {
  const dateFormatted = testedAt
    ? new Date(testedAt).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="relative flex items-center justify-between border-t-2 border-dashed border-gray-200 pt-4">
      {/* Tanda Tangan Analis */}
      <div className="text-center font-sans">
        <span className="block text-[10px] text-gray-400 uppercase font-semibold">
          Petugas Analis Laboratorium
        </span>
        {/* Simulasi Goresan TTD Digital */}
        <div className="my-1.5 flex h-10 items-center justify-center font-serif text-lg italic text-blue-900 select-none">
          {analystName.split(" ")[0]}..~
        </div>
        <div className="border-t border-gray-300 pt-1">
          <strong className="block text-xs font-bold text-[#1c1d22]">{analystName}</strong>
          <span className="block text-[10px] text-gray-400">Quality Control Specialist</span>
        </div>
      </div>

      {/* Cap Stempel Resmi Lab (Embossed Rubber Stamp) */}
      <div className="relative select-none">
        <div className="relative flex size-28 -rotate-12 flex-col items-center justify-center rounded-full border-[3px] border-double border-red-600/80 bg-red-500/5 p-2 text-center text-red-600 shadow-sm ring-1 ring-red-400/40">
          {/* Garis Lingkaran Dalam */}
          <div className="absolute inset-1 rounded-full border border-dashed border-red-500/60" />

          {/* Isi Teks Cap */}
          <span className="z-10 font-mono text-[8px] font-black uppercase tracking-widest text-red-700">
            ★ PKS SAWAIGHT LAB ★
          </span>

          <div className="z-10 my-0.5 border-y border-red-600/70 py-0.5 px-2">
            <span className="block font-mono text-[10px] font-black tracking-tight text-red-700 leading-tight">
              {statusText}
            </span>
          </div>

          <span className="z-10 font-mono text-[8px] font-bold text-red-800">
            {dateFormatted}
          </span>

          <span className="z-10 text-[7px] font-bold uppercase tracking-wider text-red-600/90">
            QA/QC DEPT
          </span>
        </div>
      </div>
    </div>
  );
}
