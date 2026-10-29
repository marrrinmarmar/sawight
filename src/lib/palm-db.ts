/**
 * PalmQual-AI - Database Persistence Layer (TypeScript port)
 * File-backed repository for palm oil harvest batches.
 * Mirrors backend/db.js from the original Express implementation.
 */

import fs from "fs";
import path from "path";
import { evaluateRuleBased, type PalmEvaluation, type PalmParams } from "./palm-engine";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "batches.json");

export type PalmBatch = {
  batch_id: string;
  lokasi_kebun: string;
  tanggal_panen: string;
  lama_penyimpanan_jam: number;
  warna: string;
  viskositas_mPa_s: number;
  pH: number;
  kadar_ffa_percent: number;
  moisture_percent: number;
  berat_ton: number;
  track_type: string;
  category: string;
  primary_recommendation: string;
  alternate_recommendation: string;
  confidence_score: number;
  ai_explanation: string;
  action_steps: string[];
  status: string;
  created_at: string;
  details?: Partial<PalmEvaluation["details"]>;
};

export type PalmStats = {
  total_batches: number;
  total_tonnage: number;
  avg_ffa: number;
  avg_hold_time: number;
  distribution: {
    cpo_default: number;
    bio_eco_friendly: number;
    other_products: number;
    cpo_percent: number;
    bio_percent: number;
    other_percent: number;
  };
};

function loadBatches(): PalmBatch[] {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw) as PalmBatch[];
  } catch (err) {
    console.error("[DB Load Error] Reverting to empty store:", err);
    return [];
  }
}

function saveBatches(batches: PalmBatch[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(batches, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("[DB Save Error]:", err);
    return false;
  }
}

function getAll(): PalmBatch[] {
  return loadBatches();
}

function getById(batchId: string): PalmBatch | null {
  return loadBatches().find((b) => b.batch_id === batchId) || null;
}

function create(data: PalmParams & Partial<PalmBatch>, evaluation: PalmEvaluation): PalmBatch {
  const batches = loadBatches();

  const batch_id = data.batch_id || `LOT-${Date.now().toString().slice(-6)}`;

  const newBatch: PalmBatch = {
    batch_id,
    lokasi_kebun: data.lokasi_kebun || "Kebun PKS Sawit Makmur",
    tanggal_panen: data.tanggal_panen || new Date().toISOString(),
    lama_penyimpanan_jam: Number(data.lama_penyimpanan_jam) || 0,
    warna: data.warna || "Sangat Merah Kecoklatan",
    viskositas_mPa_s: Number(data.viskositas_mPa_s) || 45,
    pH: Number(data.pH) || 6.0,
    kadar_ffa_percent: Number(data.kadar_ffa_percent) || 2.0,
    moisture_percent: Number(data.moisture_percent) || 0.2,
    berat_ton: Number(data.berat_ton) || 25.0,
    track_type: evaluation.track_type,
    category: evaluation.category,
    primary_recommendation: evaluation.primary_recommendation,
    alternate_recommendation: evaluation.alternate_recommendation,
    confidence_score: evaluation.confidence_score,
    ai_explanation: evaluation.ai_explanation,
    action_steps: evaluation.action_steps,
    status: `Dispatched ke ${evaluation.primary_recommendation.split("/")[0].trim()}`,
    created_at: new Date().toISOString(),
    details: evaluation.details,
  };

  // Prepend to list
  batches.unshift(newBatch);
  saveBatches(batches);
  return newBatch;
}

function remove(batchId: string): boolean {
  const batches = loadBatches();
  const filtered = batches.filter((b) => b.batch_id !== batchId);
  if (filtered.length === batches.length) return false;
  saveBatches(filtered);
  return true;
}

function reset(factoryBatches?: PalmBatch[]): PalmBatch[] {
  const factory = factoryBatches?.length ? factoryBatches : getFactoryBatches();
  saveBatches(factory);
  return [...factory];
}

/** Factory-default lot data (kept separately from the live store). */
function getFactoryBatches(): PalmBatch[] {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, "factory.json"), "utf8");
    return JSON.parse(raw) as PalmBatch[];
  } catch {
    return [];
  }
}

function getStatistics(): PalmStats {
  const batches = loadBatches();
  const total = batches.length;
  if (total === 0) {
    return {
      total_batches: 0,
      total_tonnage: 0,
      avg_ffa: 0,
      avg_hold_time: 0,
      distribution: {
        cpo_default: 0,
        bio_eco_friendly: 0,
        other_products: 0,
        cpo_percent: 0,
        bio_percent: 0,
        other_percent: 0,
      },
    };
  }

  let sumTonnage = 0;
  let sumFfa = 0;
  let sumHold = 0;
  let cpoCount = 0;
  let bioCount = 0;
  let otherCount = 0;

  batches.forEach((b) => {
    sumTonnage += Number(b.berat_ton) || 0;
    sumFfa += Number(b.kadar_ffa_percent) || 0;
    sumHold += Number(b.lama_penyimpanan_jam) || 0;

    if (b.category === "CPO_DEFAULT") cpoCount++;
    else if (b.category === "BIO_ECO_FRIENDLY") bioCount++;
    else otherCount++;
  });

  return {
    total_batches: total,
    total_tonnage: Math.round(sumTonnage * 10) / 10,
    avg_ffa: Number((sumFfa / total).toFixed(2)),
    avg_hold_time: Number((sumHold / total).toFixed(1)),
    distribution: {
      cpo_default: cpoCount,
      bio_eco_friendly: bioCount,
      other_products: otherCount,
      cpo_percent: Math.round((cpoCount / total) * 100),
      bio_percent: Math.round((bioCount / total) * 100),
      other_percent: Math.round((otherCount / total) * 100),
    },
  };
}

export const palmDb = {
  getAll,
  getById,
  create,
  remove,
  reset,
  getFactoryBatches,
  getStatistics,
};

export { evaluateRuleBased };
