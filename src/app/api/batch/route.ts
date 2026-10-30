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

    // Mode: Pengelola (Pencatatan TBS cair, belum ada lab parameter)
    if (payload.action === "pengelola_intake" || payload.is_pengelola) {
      if (!payload.berat_ton) {
        return NextResponse.json(
          { error: "Bad Request", message: "Berat (ton) harus diisi oleh Pengelola." },
          { status: 400 }
        );
      }
      const newBatch = palmDb.createFromPengelola({
        batch_id: payload.batch_id,
        lokasi_kebun: payload.lokasi_kebun,
        tanggal_panen: payload.tanggal_panen,
        jam_masuk: payload.jam_masuk,
        berat_ton: Number(payload.berat_ton) || 0,
        lama_penyimpanan_jam: Number(payload.lama_penyimpanan_jam) || 0,
      });

      return NextResponse.json(
        {
          success: true,
          message: `Batch [${newBatch.batch_id}] berhasil dibuat & dikirim ke antrean Lab.`,
          data: newBatch,
        },
        { status: 201 }
      );
    }

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
    const evaluation = await evaluateWithPython(payload as any, pythonUrl);

    // Persist into database store
    const newBatch = palmDb.create(payload as any, evaluation);

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
 * GET /api/batch?track=&category=&status=&search= — lists all palm oil batches
 * (mirrors GET /api/batch/list)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const track = searchParams.get("track");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let list = palmDb.getAll();

    if (status) {
      list = list.filter((b) => (b.status || "").toUpperCase() === status.toUpperCase());
    }
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
