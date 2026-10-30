import { NextResponse, type NextRequest } from "next/server";
import { evaluateWithGemini, type PalmParams } from "@/lib/palm-engine";
import { evaluateWithN8n } from "@/lib/n8n-client";

/**
 * POST /api/analysis — evaluate a palm oil sample through the engine
 * (mirrors POST /api/analysis of the old Express server; no persistence)
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as PalmParams & {
      gemini_api_key?: string;
      use_n8n?: boolean;
      n8n_webhook_url?: string;
    };

    const n8nEnabled =
      payload.use_n8n !== false &&
      (process.env.N8N_WEBHOOK_ENABLED === "true" || !!payload.n8n_webhook_url);
    const n8nUrl = payload.n8n_webhook_url || process.env.N8N_WEBHOOK_URL;

    let result;
    if (n8nEnabled) {
      result = await evaluateWithN8n(payload, n8nUrl);
    } else {
      const apiKey =
        payload.gemini_api_key || request.headers.get("x-gemini-key") || undefined;
      result = await evaluateWithGemini(payload, apiKey);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", message: String(error) },
      { status: 500 }
    );
  }
}
