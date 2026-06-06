import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB = {
  host: "localhost", port: 3306,
  user: "root", password: "", database: "sunny_pet",
};

// GET /api/orders
export async function GET(req: NextRequest) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];
    if (status) { where += " AND o.status = ?"; params.push(status); }
    if (search) { where += " AND c.name LIKE ?"; params.push(`%${search}%`); }

    const [items]: any = await conn.execute(
      `SELECT o.*, c.name as customerName, c.phone as customerPhone
       FROM \`Order\` o
       LEFT JOIN Customer c ON o.customerId = c.id
       ${where} ORDER BY o.createdAt DESC LIMIT ${parseInt(String(limit))} OFFSET ${parseInt(String(offset))}`,
      params
    );

    const [countResult]: any = await conn.execute(
      `SELECT COUNT(*) as total FROM \`Order\` o
       LEFT JOIN Customer c ON o.customerId = c.id ${where}`,
      params
    );

    // Get items for each order
    for (const order of items) {
      const [orderItems]: any = await conn.execute(
        `SELECT oi.*, p.name as productName, p.code as productCode
         FROM OrderItem oi LEFT JOIN Product p ON oi.productId = p.id
         WHERE oi.orderId = ?`,
        [order.id]
      );
      order.items = orderItems;
    }

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

// POST /api/orders
export async function POST(req: NextRequest) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const body = await req.json();
    const { customerId, items, discount, note, promotionId, paymentMethod } = body;
    const pm: "CASH" | "BANK_TRANSFER" = paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "CASH";

    if (!customerId || !items || items.length === 0) {
      await conn.end();
      return NextResponse.json({ success: false, error: "Thiếu khách hàng hoặc sản phẩm" }, { status: 400 });
    }

    // Validate stock
    for (const item of items) {
      const [pRows]: any = await conn.execute(
        "SELECT name, stock FROM Product WHERE id = ?", [item.productId]
      );
      if (!pRows.length) {
        await conn.end();
        return NextResponse.json({ success: false, error: `Sản phẩm không tồn tại` }, { status: 400 });
      }
      if (pRows[0].stock < item.quantity) {
        await conn.end();
        return NextResponse.json({
          success: false,
          error: `"${pRows[0].name}" không đủ tồn kho (còn ${pRows[0].stock})`
        }, { status: 400 });
      }
    }

    const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    const discountAmt = Number(discount) || 0;
    const total = subtotal - discountAmt;
    const code = `DH${Date.now().toString().slice(-8)}`;
    const id = Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Get admin user
    const [userRows]: any = await conn.execute("SELECT id FROM User LIMIT 1");
    const userId = userRows[0]?.id || "";

    // Create order
    await conn.execute(
      `INSERT INTO \`Order\` (id, code, customerId, userId, status, subtotal, discount, total, note, paymentMethod, promotionId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, code, customerId, userId, subtotal, discountAmt, total, note || null, pm, promotionId || null, now, now]
    );

    // Create order items
    for (const item of items) {
      const itemId = Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
      await conn.execute(
        `INSERT INTO OrderItem (id, orderId, productId, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, id, item.productId, item.quantity, item.price, item.price * item.quantity]
      );
    }

    // Update customer stats
    await conn.execute(
      `UPDATE Customer SET totalOrders = totalOrders + 1, totalSpent = totalSpent + ?, lastOrderAt = ?, updatedAt = ? WHERE id = ?`,
      [total, now, now, customerId]
    );

    // Fetch created order
    const [newOrder]: any = await conn.execute(
      `SELECT o.*, c.name as customerName FROM \`Order\` o
       LEFT JOIN Customer c ON o.customerId = c.id WHERE o.id = ?`,
      [id]
    );

    await conn.end();
    return NextResponse.json({ success: true, data: newOrder[0] }, { status: 201 });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}