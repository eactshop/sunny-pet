import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB = {
  host: "localhost", port: 3306,
  user: "root", password: "", database: "sunny_pet",
};

export async function GET() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const [rows]: any = await conn.execute("SELECT * FROM Supplier ORDER BY name ASC");
    await conn.end();
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { name, phone, email, address } = await req.json();
    if (!name) { await conn.end(); return NextResponse.json({ success: false, error: "Thiếu tên NCC" }, { status: 400 }); }
    const id = Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await conn.execute(
      `INSERT INTO Supplier (id, name, phone, email, address, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, phone || null, email || null, address || null, now]
    );
    const [newRow]: any = await conn.execute("SELECT * FROM Supplier WHERE id = ?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: newRow[0] }, { status: 201 });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}