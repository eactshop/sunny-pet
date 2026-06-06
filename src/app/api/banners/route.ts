import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB = process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet";
const nowVN = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const genId = () => Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const conn = await mysql.createConnection(DB);
  try {
    const all = new URL(req.url).searchParams.get("all") === "1";
    const where = all ? "" : "WHERE active = 1";
    const [rows]: any = await conn.execute(
      `SELECT * FROM Banner ${where} ORDER BY \`order\` ASC, createdAt ASC`
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function POST(req: NextRequest) {
  const conn = await mysql.createConnection(DB);
  try {
    const { imageUrl, title, link, order, active } = await req.json();
    if (!imageUrl) return NextResponse.json({ success: false, error: "Thiếu ảnh banner" }, { status: 400 });

    const id = genId();
    const now = nowVN();
    await conn.execute(
      "INSERT INTO Banner (id, imageUrl, title, link, `order`, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, imageUrl, title || null, link || null, Number(order) || 0, active !== false ? 1 : 0, now, now]
    );
    const [rows]: any = await conn.execute("SELECT * FROM Banner WHERE id = ?", [id]);
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  } finally {
    await conn.end();
  }
}
