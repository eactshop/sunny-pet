import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB = process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet";
const genId = () => Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
const nowVN = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export async function GET(req: NextRequest) {
  const conn = await mysql.createConnection(DB);
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    let where = "WHERE 1=1";
    const params: any[] = [];
    if (search) { where += " AND (code LIKE ? OR name LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (status === "active") { where += " AND active=1 AND endDate >= NOW()"; }
    else if (status === "expired") { where += " AND (active=0 OR endDate < NOW())"; }

    const [rows]: any = await conn.execute(
      `SELECT p.*,
        (SELECT COUNT(*) FROM \`Order\` o WHERE o.promotionId = p.id) as usedCount
       FROM Promotion p ${where} ORDER BY p.createdAt DESC`,
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
    const { name, code, type, value, minOrder, maxDiscount, maxUses, startDate, endDate } = body;

    if (!name || !code || !type || !value || !startDate || !endDate) {
      await conn.end();
      return NextResponse.json({ success: false, error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Kiểm tra mã trùng
    const [exist]: any = await conn.execute("SELECT id FROM Promotion WHERE code=?", [code.toUpperCase()]);
    if (exist.length) {
      await conn.end();
      return NextResponse.json({ success: false, error: "Mã voucher đã tồn tại" }, { status: 409 });
    }

    const id = genId();
    const now = nowVN();
    await conn.execute(
      `INSERT INTO Promotion (id, code, name, type, value, minOrder, maxDiscount, maxUses, startDate, endDate, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, code.toUpperCase(), name, type, Number(value), Number(minOrder) || null, Number(maxDiscount) || null, Number(maxUses) || null,
       startDate, endDate, now, now]
    );
    const [newRow]: any = await conn.execute("SELECT * FROM Promotion WHERE id=?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: newRow[0] }, { status: 201 });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
