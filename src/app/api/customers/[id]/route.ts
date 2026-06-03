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
    return verifyToken(token);
  } catch { return null; }
}

export async function GET(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { id } = await context.params;
    const [rows]: any = await conn.execute("SELECT * FROM Customer WHERE id = ?", [id]);
    if (!rows.length) { await conn.end(); return NextResponse.json({ success: false, error: "Không tìm thấy" }, { status: 404 }); }
    const [pets]: any = await conn.execute("SELECT * FROM Pet WHERE customerId = ? ORDER BY createdAt DESC", [id]);
    const [orders]: any = await conn.execute(
      `SELECT o.*, COUNT(oi.id) as itemCount FROM \`Order\` o LEFT JOIN OrderItem oi ON oi.orderId = o.id WHERE o.customerId = ? GROUP BY o.id ORDER BY o.createdAt DESC LIMIT 10`, [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: { ...rows[0], pets, orders } });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { id } = await context.params;
    const body = await req.json();
    const name = String(body.name || "");
    const phone = String(body.phone || "");
    const address = body.address ? String(body.address) : null;
    if (!name || !phone) { await conn.end(); return NextResponse.json({ success: false, error: "Thiếu tên hoặc SĐT" }, { status: 400 }); }
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await conn.execute("UPDATE Customer SET name=?, phone=?, address=?, updatedAt=? WHERE id=?", [name, phone, address, now, id]);
    const [updated]: any = await conn.execute("SELECT * FROM Customer WHERE id = ?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (e: any) {
    await conn.end();
    if (e.code === "ER_DUP_ENTRY") return NextResponse.json({ success: false, error: "Số điện thoại đã tồn tại" }, { status: 409 });
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    // Chỉ OWNER mới được xóa
    const user = await checkOwner();
    if (!user) { await conn.end(); return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); }
    if (user.role !== "OWNER") { await conn.end(); return NextResponse.json({ success: false, error: "Bạn không có quyền xóa!" }, { status: 403 }); }

    const { id } = await context.params;
    const [orders]: any = await conn.execute("SELECT id FROM `Order` WHERE customerId = ?", [id]);
    for (const o of orders) await conn.execute("DELETE FROM OrderItem WHERE orderId = ?", [o.id]);
    await conn.execute("DELETE FROM `Order` WHERE customerId = ?", [id]);
    await conn.execute("DELETE FROM Appointment WHERE customerId = ?", [id]);
    await conn.execute("DELETE FROM Pet WHERE customerId = ?", [id]);
    await conn.execute("DELETE FROM Customer WHERE id = ?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: { message: "Đã xóa khách hàng" } });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}