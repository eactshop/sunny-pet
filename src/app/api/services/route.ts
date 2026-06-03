import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB = {
  host: "localhost", port: 3306,
  user: "root", password: "", database: "sunny_pet",
};

export async function GET() {
  const conn = await mysql.createConnection(DB);
  try {
    const [rows]: any = await conn.execute(
      "SELECT * FROM Service WHERE active = 1 ORDER BY name ASC"
    );
    await conn.end();
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const conn = await mysql.createConnection(DB);
  try {
    const { name, price, duration, description } = await req.json();
    if (!name || !price) {
      await conn.end();
      return NextResponse.json({ success: false, error: "Thiếu tên hoặc giá" }, { status: 400 });
    }
    const id = Math.random().toString(36).slice(2, 26);
    await conn.execute(
      `INSERT INTO Service (id, name, price, duration, description, active) VALUES (?, ?, ?, ?, ?, 1)`,
      [id, name, Number(price), Number(duration) || 60, description || null]
    );
    const [row]: any = await conn.execute("SELECT * FROM Service WHERE id = ?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: row[0] }, { status: 201 });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const conn = await mysql.createConnection(DB);
  try {
    const { id, name, price, duration } = await req.json();
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await conn.execute(
      "UPDATE Service SET name=?, price=?, duration=? WHERE id=?",
      [name, Number(price), Number(duration), id]
    );
    const [row]: any = await conn.execute("SELECT * FROM Service WHERE id = ?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: row[0] });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}