import {
  evaluateRuleBased,
  type PalmEvaluation,
  type PalmParams,
} from "./palm-engine";

/**
 * Service untuk memanggil Python AI & Real Report Engine secara langsung
 * (Full Python Architecture tanpa perantara n8n).
 */
export async function evaluateWithPython(
  params: PalmParams,
  overrideUrl?: string
): Promise<PalmEvaluation> {
  const pythonUrl =
    overrideUrl ||
    process.env.PYTHON_AI_URL ||
    "http://127.0.0.1:8000/api/analyze";

  const timeoutMs = Number(process.env.PYTHON_AI_TIMEOUT_MS) || 6000;
  const ruleBasedFallback = evaluateRuleBased(params);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const payload = {
      batch_id: params.batch_id || ruleBasedFallback.batch_id,
      lokasi_kebun: params.lokasi_kebun || ruleBasedFallback.details.lokasi_kebun,
      tanggal_panen: params.tanggal_panen || ruleBasedFallback.details.tanggal_panen,
      lama_penyimpanan_jam: Number(params.lama_penyimpanan_jam ?? ruleBasedFallback.details.lama_penyimpanan_jam),
      warna: params.warna || ruleBasedFallback.details.warna,
      viskositas_mPa_s: Number(params.viskositas_mPa_s ?? ruleBasedFallback.details.viskositas_mPa_s),
      pH: Number(params.pH ?? ruleBasedFallback.details.pH),
      kadar_ffa_percent: Number(params.kadar_ffa_percent ?? ruleBasedFallback.details.kadar_ffa_percent),
      moisture_percent: Number(params.moisture_percent ?? ruleBasedFallback.details.moisture_percent),
      berat_ton: Number(params.berat_ton ?? ruleBasedFallback.details.berat_ton),
    };

    const res = await fetch(pythonUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Python AI Engine error status: ${res.status}`);
    }

    const data = (await res.json()) as PalmEvaluation;

    if (data && data.primary_recommendation && data.details) {
      return data;
    }

    return ruleBasedFallback;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Python AI Warning] Gagal atau timeout (${errorMsg}). Fallback ke internal rule-based.`);
    return {
      ...ruleBasedFallback,
      details: {
        ...ruleBasedFallback.details,
        engine_mode: `Rule-Based Fallback (Python: ${errorMsg.slice(0, 35)}...)`,
      },
    };
  }
}
