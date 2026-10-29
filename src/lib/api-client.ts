/**
 * PalmQual-AI — typed API client (port of js/api-client.js)
 */

import type { PalmBatch, PalmStats } from "./palm-db";
import type { PalmEvaluation, PalmParams } from "./palm-engine";

export type BatchFilters = {
  track?: string;
  category?: string;
  search?: string;
};

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((json.message as string) || `HTTP ${res.status}`);
  }
  return json as T;
}

export function getStats() {
  return http<{ success: boolean; data: PalmStats }>("/api/stats").then((r) => r.data);
}

export function listBatches(filters: BatchFilters = {}) {
  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][]
  ).toString();
  return http<{ success: boolean; count: number; data: PalmBatch[] }>(
    `/api/batch${qs ? `?${qs}` : ""}`
  ).then((r) => r.data);
}

export function getBatch(id: string) {
  return http<{ success: boolean; data: PalmBatch }>(`/api/batch/${id}`).then((r) => r.data);
}

export function deleteBatch(id: string) {
  return http<{ success: boolean; message: string }>(`/api/batch/${id}`, { method: "DELETE" });
}

export function resetBatches() {
  return http<{ success: boolean; count: number }>("/api/batch/reset", { method: "POST" });
}

export function analyzeSample(params: PalmParams, geminiKey?: string) {
  return http<{ success: boolean; data: PalmEvaluation }>("/api/analysis", {
    method: "POST",
    body: JSON.stringify({ ...params, gemini_api_key: geminiKey || undefined }),
    headers: geminiKey ? { "x-gemini-key": geminiKey } : undefined,
  }).then((r) => r.data);
}

export function createBatch(batch: PalmParams, geminiKey?: string) {
  return http<{ success: boolean; message: string; data: PalmBatch }>("/api/batch", {
    method: "POST",
    body: JSON.stringify({ ...batch, gemini_api_key: geminiKey || undefined }),
    headers: geminiKey ? { "x-gemini-key": geminiKey } : undefined,
  });
}
