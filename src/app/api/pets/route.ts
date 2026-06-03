import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB = {
  host: "localhost", port: 3306,
  user: "root", password: "", database: "sunny_pet",
};

export async function GET(req: NextRequest) {
  const conn = await mysql.createConnection(DB);
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") || "";
    const search = searchParams.get("search") || "";

    let where = "WHERE 1=1";
    const params: any[] = [];
    if (customerId) { where += " AND p.customerId = ?"; params.push(customerId); }
    if (search) { where += " AND (p.name LIKE ? OR p.breed LIKE ? OR c.name LIKE ?)"; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const [rows]: any = await conn.execute(
      `SELECT p.*, c.name as ownerName, c.phone as ownerPhone
       FROM Pet p LEFT JOIN Customer c ON p.customerId = c.id
       ${where} ORDER BY p.createdAt DESC`,
      params
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
    const body = await req.json();
    const { name, species, breed, gender, birthDate, weight, note, customerId } = body;
    if (!name || !customerId) { await conn.end(); return NextResponse.json({ success: false, error: "Thiếu tên pet hoặc khách hàng" }, { status: 400 }); }

    const id = Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await conn.execute(
      `INSERT INTO Pet (id, name, species, breed, gender, birthDate, weight, note, customerId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, species || "Chó", breed || null, gender || null,
       birthDate ? new Date(birthDate).toISOString().slice(0, 10) : null,
       weight ? Number(weight) : null, note || null, customerId, now]
    );

    const [newPet]: any = await conn.execute(
      `SELECT p.*, c.name as ownerName FROM Pet p LEFT JOIN Customer c ON p.customerId = c.id WHERE p.id = ?`, [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: newPet[0] }, { status: 201 });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// PUT /api/pets/[id]
export async function PUT(req: NextRequest) {
  return NextResponse.json({ success: false, error: "Use /api/pets/[id]" }, { status: 405 });
}