import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const DB = { host: "localhost", port: 3306, user: "root", password: "", database: "sunny_pet" };

async function checkOwner() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    const user = verifyToken(token);
    return user;
  } catch { return null; }
}

export async function GET(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { id } = await context.params;
    const [rows]: any = await conn.execute(
      `SELECT p.*, c.name as categoryName FROM Product p LEFT JOIN Category c ON p.categoryId = c.id WHERE p.id = ?`, [id]
    );
    await conn.end();
    if (!rows.length) return NextResponse.json({ success: false, error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { id } = await context.params;
    const body = await req.json();
    const name = String(body.name || "");
    const description = body.description ? String(body.description) : null;
    const buyPrice = Number(body.buyPrice) || 0;
    const sellPrice = Number(body.sellPrice) || 0;
    const stock = Number(body.stock) || 0;
    const minStock = Number(body.minStock) || 5;
    const categoryId = String(body.categoryId || "");
    const image = body.image ? String(body.image) : null;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (!name || !categoryId) { await conn.end(); return NextResponse.json({ success: false, error: "Thiếu tên hoặc danh mục" }, { status: 400 }); }

    await conn.execute(
      `UPDATE Product SET name=?, description=?, buyPrice=?, sellPrice=?, stock=?, minStock=?, categoryId=?, image=?, updatedAt=? WHERE id=?`,
      [name, description, buyPrice, sellPrice, stock, minStock, categoryId, image, now, id]
    );
    const [updated]: any = await conn.execute(
      `SELECT p.*, c.name as categoryName FROM Product p LEFT JOIN Category c ON p.categoryId = c.id WHERE p.id = ?`, [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    // Chỉ OWNER mới được xóa
    const user = await checkOwner();
    if (!user) { await conn.end(); return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); }
    if (user.role !== "OWNER") { await conn.end(); return NextResponse.json({ success: false, error: "Bạn không có quyền xóa!" }, { status: 403 }); }

    const { id } = await context.params;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await conn.execute("UPDATE Product SET active=0, updatedAt=? WHERE id=?", [now, id]);
    await conn.end();
    return NextResponse.json({ success: true, data: { message: "Đã xóa sản phẩm" } });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}