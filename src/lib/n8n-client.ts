import {
  evaluateRuleBased,
  type PalmEvaluation,
  type PalmParams,
} from "./palm-engine";

/**
 * Service untuk melempar data batch sawit ke webhook n8n
 * dan menerima respon rekomendasi AI (Skenario A)
 */
export async function evaluateWithN8n(
  params: PalmParams,
  overrideUrl?: string
): Promise<PalmEvaluation> {
  const webhookUrl =
    overrideUrl ||
    process.env.N8N_WEBHOOK_URL ||
    "https://oraclen8n.dhandyanadry.my.id/webhook-test/2062ad5e-7490-4059-a905-64b61f0efb43";

  const timeoutMs = Number(process.env.N8N_WEBHOOK_TIMEOUT_MS) || 8000;
  const ruleBasedFallback = evaluateRuleBased(params);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const payload = {
      event: "EVALUATE_BATCH",
      source: "sawight-nextjs",
      timestamp: new Date().toISOString(),
      data: {
        batch_id: params.batch_id || ruleBasedFallback.batch_id,
        lokasi_kebun: params.lokasi_kebun || ruleBasedFallback.details.lokasi_kebun,
        tanggal_panen: params.tanggal_panen || ruleBasedFallback.details.tanggal_panen,
        lama_penyimpanan_jam: params.lama_penyimpanan_jam ?? ruleBasedFallback.details.lama_penyimpanan_jam,
        warna: params.warna || ruleBasedFallback.details.warna,
        viskositas_mPa_s: params.viskositas_mPa_s ?? ruleBasedFallback.details.viskositas_mPa_s,
        pH: params.pH ?? ruleBasedFallback.details.pH,
        kadar_ffa_percent: params.kadar_ffa_percent ?? ruleBasedFallback.details.kadar_ffa_percent,
        moisture_percent: params.moisture_percent ?? ruleBasedFallback.details.moisture_percent,
        berat_ton: params.berat_ton ?? ruleBasedFallback.details.berat_ton,
      },
    };

    console.log(`[n8n Client] Dispatching webhook to: ${webhookUrl}`);

    const res = await fetch(webhookUrl, {
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
      throw new Error(`n8n webhook responded with status ${res.status}: ${res.statusText}`);
    }

    const json = await res.json().catch(() => null);

    // Jika n8n mengembalikan data hasil rekomendasi:
    if (json && (json.primary_recommendation || json.category || json.data)) {
      const respData = json.data || json;
      return {
        batch_id: respData.batch_id || ruleBasedFallback.batch_id,
        track_type: respData.track_type || (respData.category === "CPO_DEFAULT" ? "DEFAULT" : "FLEX"),
        primary_recommendation:
          respData.primary_recommendation || ruleBasedFallback.primary_recommendation,
        category:
          respData.category || ruleBasedFallback.category,
        confidence_score:
          typeof respData.confidence_score === "number"
            ? respData.confidence_score
            : ruleBasedFallback.confidence_score,
        alternate_recommendation:
          respData.alternate_recommendation || ruleBasedFallback.alternate_recommendation,
        ai_explanation:
          respData.ai_explanation ||
          `Evaluasi sukses diproses oleh n8n AI Workflow Pipeline.`,
        action_steps: Array.isArray(respData.action_steps)
          ? respData.action_steps
          : ruleBasedFallback.action_steps,
        details: {
          ...ruleBasedFallback.details,
          engine_mode: "n8n AI Webhook Pipeline",
          evaluated_at: new Date().toISOString(),
        },
      };
    }

    // Jika webhook berhasil diterima (200 OK) tapi n8n hanya merespon acknowledgment sederhana
    console.log("[n8n Client] Webhook received 200 OK. Using enriched evaluation.");
    return {
      ...ruleBasedFallback,
      details: {
        ...ruleBasedFallback.details,
        engine_mode: "n8n Webhook Verified + Rule Engine",
        evaluated_at: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[n8n Webhook Warning] Gagal atau timeout (${errorMsg}). Fallback ke Rule-Based Engine.`);
    return {
      ...ruleBasedFallback,
      details: {
        ...ruleBasedFallback.details,
        engine_mode: `Rule-Based Fallback (n8n: ${errorMsg.slice(0, 40)}...)`,
      },
    };
  }
}
