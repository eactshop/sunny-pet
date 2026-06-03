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
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];
    if (search) {
      where += " AND (c.name LIKE ? OR c.phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const [items]: any = await conn.execute(
      `SELECT c.*, COUNT(DISTINCT p.id) as petCount,
  COUNT(DISTINCT a.id) as spaCount
 FROM Customer c
 LEFT JOIN Pet p ON p.customerId = c.id
 LEFT JOIN Appointment a ON a.customerId = c.id AND a.status = 'COMPLETED'
 ${where} GROUP BY c.id ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult]: any = await conn.execute(
      `SELECT COUNT(*) as total FROM Customer c ${where}`, params
    );

    await conn.end();
    return NextResponse.json({
      success: true,
      data: { items, total: countResult[0].total, page, totalPages: Math.ceil(countResult[0].total / limit) }
    });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const conn = await mysql.createConnection(DB);
  try {
    const { name, phone, email, address } = await req.json();
    if (!name || !phone) {
      await conn.end();
      return NextResponse.json({ success: false, error: "Thiếu tên hoặc SĐT" }, { status: 400 });
    }
    const id = Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await conn.execute(
      `INSERT INTO Customer (id, name, phone, email, address, totalOrders, totalSpent, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [id, name, phone, email || null, address || null, now, now]
    );
    const [newRow]: any = await conn.execute("SELECT * FROM Customer WHERE id = ?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: newRow[0] }, { status: 201 });
  } catch (e: any) {
    await conn.end();
    if (e.code === "ER_DUP_ENTRY") return NextResponse.json({ success: false, error: "Số điện thoại đã tồn tại" }, { status: 409 });
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}