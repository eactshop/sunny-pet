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
    const date = searchParams.get("date") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 50);
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (date) {
      where += " AND DATE(a.date) = ?";
      params.push(date);
    }
    if (status) {
      where += " AND a.status = ?";
      params.push(status);
    }
    if (search) {
      where += " AND (c.name LIKE ? OR p.name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const [items]: any = await conn.execute(
      `SELECT a.*,
        c.name as customerName, c.phone as customerPhone,
        p.name as petName, p.species as petSpecies, p.breed as petBreed,
        s.name as serviceName, s.duration as serviceDuration
       FROM Appointment a
       LEFT JOIN Customer c ON a.customerId = c.id
       LEFT JOIN Pet p ON a.petId = p.id
       LEFT JOIN Service s ON a.serviceId = s.id
       ${where} ORDER BY a.date ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult]: any = await conn.execute(
      `SELECT COUNT(*) as total FROM Appointment a
       LEFT JOIN Customer c ON a.customerId = c.id
       LEFT JOIN Pet p ON a.petId = p.id
       ${where}`,
      params
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
    const body = await req.json();
    const { customerId, petId, serviceId, date, note, price } = body;

    if (!customerId || !petId || !serviceId || !date) {
      await conn.end();
      return NextResponse.json({ success: false, error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const id = Math.random().toString(36).slice(2, 26);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await conn.execute(
      `INSERT INTO Appointment (id, customerId, petId, serviceId, date, status, note, price, createdAt)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)`,
      [id, customerId, petId, serviceId, new Date(date).toISOString().slice(0, 19).replace("T", " "), note || null, Number(price) || 0, now]
    );

    const [newRow]: any = await conn.execute(
      `SELECT a.*, c.name as customerName, c.phone as customerPhone,
        p.name as petName, p.species as petSpecies,
        s.name as serviceName, s.duration as serviceDuration
       FROM Appointment a
       LEFT JOIN Customer c ON a.customerId = c.id
       LEFT JOIN Pet p ON a.petId = p.id
       LEFT JOIN Service s ON a.serviceId = s.id
       WHERE a.id = ?`,
      [id]
    );

    await conn.end();
    return NextResponse.json({ success: true, data: newRow[0] }, { status: 201 });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}