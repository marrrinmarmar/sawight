import { NextResponse, type NextRequest } from "next/server";
import { evaluateWithGemini, type PalmParams } from "@/lib/palm-engine";

/**
 * POST /api/analysis — evaluate a palm oil sample through the engine
 * (mirrors POST /api/analysis of the old Express server; no persistence)
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as PalmParams & { gemini_api_key?: string };

    const apiKey =
      payload.gemini_api_key || request.headers.get("x-gemini-key") || undefined;

    const result = await evaluateWithGemini(payload, apiKey);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", message: String(error) },
      { status: 500 }
    );
  }
}
