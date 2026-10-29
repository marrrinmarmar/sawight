import { NextResponse } from "next/server";
import { palmDb } from "@/lib/palm-db";

/**
 * GET /api/batch/[id] — retrieve single batch details
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = palmDb.getById(id);
    if (!batch) {
      return NextResponse.json(
        { error: "Not Found", message: `Batch dengan ID [${id}] tidak ditemukan.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * DELETE /api/batch/[id] — delete a batch
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = palmDb.remove(id);
    if (!success) {
      return NextResponse.json(
        { error: "Not Found", message: `Batch [${id}] tidak ditemukan atau sudah terhapus.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: `Batch [${id}] berhasil dihapus.` });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
