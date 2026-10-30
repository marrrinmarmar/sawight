import { NextResponse, type NextRequest } from "next/server";
import { palmDb } from "@/lib/palm-db";
import { evaluateWithPython } from "@/lib/python-client";

/**
 * POST /api/batch — stores a new palm oil lot batch with automated AI allocation
 * (mirrors POST /api/batch/create of the old Express server)
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) || {};

    if (!payload.batch_id && !payload.kadar_ffa_percent) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Data batch tidak valid. Mohon sertakan batch_id dan parameter kualitas.",
        },
        { status: 400 }
      );
    }

    const pythonUrl = payload.python_url || process.env.PYTHON_AI_URL;
    const evaluation = await evaluateWithPython(payload as PalmParams, pythonUrl);

    // Persist into database store
    const newBatch = palmDb.create(payload as PalmParams, evaluation);

    return NextResponse.json(
      {
        success: true,
        message: `Batch [${newBatch.batch_id}] berhasil disimpan dan dialokasikan.`,
        data: newBatch,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/batch?track=&category=&search= — lists all palm oil batches
 * (mirrors GET /api/batch/list)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const track = searchParams.get("track");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let list = palmDb.getAll();

    if (track) {
      list = list.filter((b) => b.track_type.toUpperCase() === track.toUpperCase());
    }
    if (category) {
      list = list.filter((b) => b.category.toUpperCase() === category.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.batch_id.toLowerCase().includes(q) ||
          (b.lokasi_kebun && b.lokasi_kebun.toLowerCase().includes(q)) ||
          (b.primary_recommendation && b.primary_recommendation.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", message: String(error) },
      { status: 500 }
    );
  }
}
