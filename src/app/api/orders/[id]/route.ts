import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const DB = { host: "localhost", port: 3306, user: "root", password: "", database: "sunny_pet" };

async function getUser() {
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
    const [rows]: any = await conn.execute(
      `SELECT o.*, c.name as customerName, c.phone as customerPhone, c.address as customerAddress
       FROM \`Order\` o LEFT JOIN Customer c ON o.customerId = c.id WHERE o.id = ?`, [id]
    );
    if (!rows.length) { await conn.end(); return NextResponse.json({ success: false, error: "Không tìm thấy" }, { status: 404 }); }
    const [items]: any = await conn.execute(
      `SELECT oi.*, p.name as productName, p.code as productCode
       FROM OrderItem oi LEFT JOIN Product p ON oi.productId = p.id WHERE oi.orderId = ?`, [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: { ...rows[0], items } });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { id } = await context.params;
    const { status } = await req.json();
    const valid = ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "RETURNED", "CANCELLED"];
    if (!valid.includes(status)) { await conn.end(); return NextResponse.json({ success: false, error: "Trạng thái không hợp lệ" }, { status: 400 }); }

    const [orderRows]: any = await conn.execute("SELECT * FROM `Order` WHERE id=?", [id]);
    if (!orderRows.length) { await conn.end(); return NextResponse.json({ success: false, error: "Không tìm thấy" }, { status: 404 }); }
    const order = orderRows[0];
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const [orderItems]: any = await conn.execute("SELECT * FROM OrderItem WHERE orderId=?", [id]);

    // Trừ tồn kho khi COMPLETED
    if (status === "COMPLETED" && order.status !== "COMPLETED") {
      for (const item of orderItems) {
        await conn.execute("UPDATE Product SET stock=stock-?, updatedAt=? WHERE id=?", [item.quantity, now, item.productId]);
        const invId = Math.random().toString(36).slice(2, 26);
        await conn.execute(`INSERT INTO Inventory (id, productId, type, quantity, note, createdAt) VALUES (?,?,'OUT',?,?,?)`,
          [invId, item.productId, item.quantity, `Xuất kho đơn ${order.code}`, now]);
      }
    }

    // Hoàn kho khi RETURNED từ COMPLETED
    if (status === "RETURNED" && order.status === "COMPLETED") {
      for (const item of orderItems) {
        await conn.execute("UPDATE Product SET stock=stock+?, updatedAt=? WHERE id=?", [item.quantity, now, item.productId]);
        const invId = Math.random().toString(36).slice(2, 26);
        await conn.execute(`INSERT INTO Inventory (id, productId, type, quantity, note, createdAt) VALUES (?,?,'IN',?,?,?)`,
          [invId, item.productId, item.quantity, `Hoàn kho đơn ${order.code}`, now]);
      }
      await conn.execute("UPDATE Customer SET totalOrders=totalOrders-1, totalSpent=totalSpent-?, updatedAt=? WHERE id=?",
        [order.total, now, order.customerId]);
    }

    await conn.execute("UPDATE `Order` SET status=?, updatedAt=? WHERE id=?", [status, now, id]);
    const [updated]: any = await conn.execute(
      `SELECT o.*, c.name as customerName, c.phone as customerPhone FROM \`Order\` o
       LEFT JOIN Customer c ON o.customerId=c.id WHERE o.id=?`, [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    // Chỉ OWNER mới được xóa
    const user = await getUser();
    if (!user) { await conn.end(); return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); }
    if (user.role !== "OWNER") { await conn.end(); return NextResponse.json({ success: false, error: "Bạn không có quyền xóa!" }, { status: 403 }); }

    const { id } = await context.params;
    await conn.execute("DELETE FROM OrderItem WHERE orderId=?", [id]);
    await conn.execute("DELETE FROM `Order` WHERE id=?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: { message: "Đã xóa đơn hàng" } });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}