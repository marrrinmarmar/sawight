import { NextResponse } from "next/server";
import { palmDb } from "@/lib/palm-db";

/**
 * POST /api/batch/reset — resets database to factory defaults (mirrors old server)
 */
export async function POST(_request: Request) {
  try {
    const list = palmDb.reset();
    return NextResponse.json({
      success: true,
      message: "Database berhasil direset ke data awal PKS.",
      count: list.length,
      data: list,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
