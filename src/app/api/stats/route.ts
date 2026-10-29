import { NextResponse } from "next/server";
import { palmDb } from "@/lib/palm-db";

/**
 * GET /api/stats — Dashboard statistics (mirrors GET /api/stats of the old Express server)
 */
export async function GET() {
  try {
    const stats = palmDb.getStatistics();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", message: String(error) },
      { status: 500 }
    );
  }
}
