import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB = process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet";
const nowVN = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const conn = await mysql.createConnection(DB);
  try {
    const { id } = await params;
    const { imageUrl, title, link, order, active } = await req.json();
    if (!imageUrl) return NextResponse.json({ success: false, error: "Thiếu ảnh" }, { status: 400 });

    await conn.execute(
      "UPDATE Banner SET imageUrl=?, title=?, link=?, `order`=?, active=?, updatedAt=? WHERE id=?",
      [imageUrl, title || null, link || null, Number(order) || 0, active ? 1 : 0, nowVN(), id]
    );
    const [rows]: any = await conn.execute("SELECT * FROM Banner WHERE id=?", [id]);
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const conn = await mysql.createConnection(DB);
  try {
    const { id } = await params;
    await conn.execute("DELETE FROM Banner WHERE id=?", [id]);
    return NextResponse.json({ success: true, data: { message: "Đã xóa banner" } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  } finally {
    await conn.end();
  }
}
