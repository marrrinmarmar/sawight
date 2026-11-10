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
    X,
    ScrollText,
    Activity,
    UserCheck,
    Bot,
    Filter,
    Search,
    RefreshCcw,
    Calendar,
    ArrowUpRight,
    Zap
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

interface ActivityLogItem {
    id: string;
    type: "employee" | "ai";
    actor: string;
    role: string;
    action: string;
    target: string;
    timestamp: string;
    status: "success" | "warning" | "info";
    details?: string;
}

export default function LabPage() {
    const [batches, setBatches] = useState<PalmBatch[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [viewingCoaModal, setViewingCoaModal] = useState<PalmBatch | null>(null);

    // Activity Log States
    const [filterType, setFilterType] = useState<"all" | "employee" | "ai">("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Dummy structured logs for Employee & AI activities
    const [logs, setLogs] = useState<ActivityLogItem[]>([
        {
            id: "LOG-1092",
            type: "employee",
            actor: "Budi Santoso",
            role: "Operator Pengelola PKS",
            action: "Input Data Batch Baru",
            target: "LOT-2026-089 (Kebun Sawit Sejahtera)",
            timestamp: "10 Min yang lalu",
            status: "success",
            details: "Berat cairan: 45 Ton, Holding time: 6 Jam tercatat."
        },
        {
            id: "LOG-1091",
            type: "ai",
            actor: "Sawight Python Engine",
            role: "AI Quality Predictor",
            action: "Kalkulasi Parameter Mutu & Scoring",
            target: "Batch LOT-2026-088",
            timestamp: "25 Min yang lalu",
            status: "success",
            details: "Confidence score 98.4%, Track Super CPO direkomendasikan."
        },
        {
            id: "LOG-1090",
            type: "employee",
            actor: "Dr. Siti Rahma",
            role: "Analis Lab Utama",
            action: "Penerbitan Surat COA",
            target: "COA/LAB/2026/088",
            timestamp: "42 Min yang lalu",
            status: "success",
            details: "Parameter pH 6.4, FFA 2.1%, Moisture 0.20% divalidasi manual."
        },
        {
            id: "LOG-1089",
            type: "ai",
            actor: "Auto-Polling & Anomaly Guard",
            role: "System Monitor",
            action: "Deteksi Perubahan Suhu Tangki",
            target: "Storage Tank B-02",
            timestamp: "1 Jam yang lalu",
            status: "warning",
            details: "Suhu naik +2.1°C dari ambang batas optimal, notifikasi dikirim ke teknisi."
        },
        {
            id: "LOG-1088",
            type: "employee",
            actor: "Ahmad Fauzi",
            role: "Petugas Gudang / Warehouse",
            action: "Alokasi Tangki FIFO",
            target: "LOT-2026-085 ke Tangki T-01",
            timestamp: "2 Jam yang lalu",
            status: "info",
            details: "Distribusi muatan selesai tanpa hambatan."
        }
    ]);

    const loadBatches = useCallback(async (isBackground = false) => {
        if (!isBackground) setLoadingList(true);
        try {
            const data = await listBatches();
            setBatches(data);
        } catch (err) {
            console.error(err);
        } finally {
            if (!isBackground) setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        loadBatches(false);
        const interval = setInterval(() => {
            loadBatches(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [loadBatches]);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await loadBatches(false);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const filteredLogs = logs.filter((log) => {
        const matchesType = filterType === "all" || log.type === filterType;
        const matchesSearch =
            log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="space-y-6 pb-12">
            {/* Header Info */}
            <div className="stat-card-shadow flex flex-col justify-between gap-4 rounded-[1.75rem] bg-gradient-to-r from-[#1c1d22] to-[#252836] p-6 text-white md:flex-row md:items-center">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                        <ScrollText className="size-3.5" />
                        Activity Log &amp; Monitoring
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                        Pemantauan Aktifitas Karyawan &amp; AI Engine
                    </h1>
                    <p className="text-xs text-gray-400">
                        Audit real-time seluruh aktivitas operasional pabrik, input data lab, dan keputusan otomatis model AI.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleManualRefresh}
                    className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-bold text-white transition-all backdrop-blur-md"
                >
                    <RefreshCcw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>Sinkronisasi Log</span>
                </button>
            </div>

            {/* Main Log Section */}
            <div className="space-y-5">
                {/* Filter & Search Bar */}
                <div className="stat-card-shadow flex flex-col gap-4 rounded-[1.75rem] bg-white p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFilterType("all")}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                filterType === "all"
                                    ? "bg-[#1c1d22] text-white shadow-md"
                                    : "bg-[#f8f9f6] text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            Semua Aktivitas
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType("employee")}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                filterType === "employee"
                                    ? "bg-[#1c1d22] text-white shadow-md"
                                    : "bg-[#f8f9f6] text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            <UserCheck className="size-3.5 text-[#84cc16]" />
                            <span>Karyawan / Staff</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType("ai")}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                filterType === "ai"
                                    ? "bg-[#1c1d22] text-white shadow-md"
                                    : "bg-[#f8f9f6] text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            <Bot className="size-3.5 text-sky-400" />
                            <span>AI Engine</span>
                        </button>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari ID, aktor, atau aksi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8f9f6] pl-10 pr-4 text-xs text-gray-800 outline-none focus:border-[#84cc16] focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {/* Log Stream Cards */}
                <div id="LOG" className="space-y-3">
                    {filteredLogs.length === 0 ? (
                        <div className="stat-card-shadow rounded-[1.75rem] bg-white p-12 text-center text-xs text-gray-400">
                            Tidak ada log aktivitas yang cocok dengan kriteria pencarian Anda.
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const isAI = log.type === "ai";
                            return (
                                <div
                                    key={log.id}
                                    className="stat-card-shadow group rounded-2xl bg-white p-5 transition-all hover:translate-x-0.5 border border-gray-100/80 hover:border-[#84cc16]/40"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-start gap-3.5">
                                            <div
                                                className={`flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                                                    isAI
                                                        ? "bg-sky-50 text-sky-600 ring-1 ring-sky-200"
                                                        : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                                                }`}
                                            >
                                                {isAI ? <Bot className="size-5" /> : <UserCheck className="size-5" />}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-[#1c1d22]">
                                                        {log.id}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            isAI
                                                                ? "bg-sky-100 text-sky-700"
                                                                : "bg-emerald-100 text-emerald-700"
                                                        }`}
                                                    >
                                                        {isAI ? "Automated AI" : "Staff Operation"}
                                                    </span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        {log.actor}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        ({log.role})
                                                    </span>
                                                </div>

                                                <div className="text-xs font-bold text-[#1c1d22] flex items-center gap-1.5">
                                                    <span>{log.action}</span>
                                                    <ChevronRight className="size-3 text-gray-400" />
                                                    <span className="text-[#65a30d] font-mono">{log.target}</span>
                                                </div>

                                                {log.details && (
                                                    <p className="text-[11px] text-gray-500 pt-0.5">
                                                        {log.details}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-gray-100 pt-3 sm:border-0 sm:pt-0">
                                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                                                <Clock className="size-3.5" />
                                                <span>{log.timestamp}</span>
                                            </div>
                                            <span
                                                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                                    log.status === "success"
                                                        ? "bg-[#f4f7ee] text-[#65a30d]"
                                                        : log.status === "warning"
                                                        ? "bg-amber-50 text-amber-700"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {log.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal Surat Lab (COA) Preview */}
            {viewingCoaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 p-1 ring-1 ring-black/5">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/logo.png" alt="Sawight Logo" className="size-full object-contain" />
                                </div>
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