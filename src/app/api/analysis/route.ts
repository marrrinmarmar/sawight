import { NextResponse, type NextRequest } from "next/server";
import { evaluateWithGemini, type PalmParams } from "@/lib/palm-engine";
import { evaluateWithPython } from "@/lib/python-client";

/**
 * POST /api/analysis — evaluate a palm oil sample through Python AI Engine
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as PalmParams & {
      gemini_api_key?: string;
      python_url?: string;
    };

    // Prioritas 1: Full Python AI & Real Report Engine
    const pythonUrl = payload.python_url || process.env.PYTHON_AI_URL;
    const result = await evaluateWithPython(payload, pythonUrl);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", message: String(error) },
      { status: 500 }
    );
  }
}
