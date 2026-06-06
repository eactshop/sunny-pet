import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const conn = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet"
  );
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since") || "";

    // Đơn hàng mới trong 24h gần nhất
    const sinceClause = since
      ? `AND o.createdAt > '${since.replace("T", " ").slice(0, 19)}'`
      : "AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";

    const [newOrders]: any = await conn.execute(
      `SELECT o.id, o.code, o.total, o.status, o.createdAt, o.orderSource,
              c.name as customerName, c.phone as customerPhone
       FROM \`Order\` o
       LEFT JOIN Customer c ON o.customerId = c.id
       WHERE 1=1 ${sinceClause}
       ORDER BY o.createdAt DESC LIMIT 20`
    );

    // Lịch spa hôm nay chưa hoàn thành
    const sinceSpa = since
      ? `AND a.createdAt > '${since.replace("T", " ").slice(0, 19)}'`
      : "AND a.createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";

    const [newSpa]: any = await conn.execute(
      `SELECT a.id, a.date, a.status, a.price, a.createdAt,
              c.name as customerName, c.phone as customerPhone,
              p.name as petName, s.name as serviceName
       FROM Appointment a
       LEFT JOIN Customer c ON a.customerId = c.id
       LEFT JOIN Pet p ON a.petId = p.id
       LEFT JOIN Service s ON a.serviceId = s.id
       WHERE 1=1 ${sinceSpa}
       ORDER BY a.createdAt DESC LIMIT 20`
    );

    // Đơn hàng đang chờ xử lý (PENDING)
    const [pendingOrders]: any = await conn.execute(
      `SELECT COUNT(*) as count FROM \`Order\` WHERE status = 'PENDING'`
    );

    await conn.end();

    const notifications = [
      ...newOrders.map((o: any) => ({
        id: `order-${o.id}`,
        type: "order",
        title: `Đơn hàng mới: ${o.code}`,
        body: `${o.customerName} - ${Number(o.total).toLocaleString("vi-VN")}đ`,
        status: o.status,
        source: o.orderSource,
        href: "/dashboard/orders",
        createdAt: o.createdAt,
        isNew: true,
      })),
      ...newSpa.map((a: any) => ({
        id: `spa-${a.id}`,
        type: "spa",
        title: `Lịch Spa mới: ${a.serviceName}`,
        body: `${a.customerName} - ${a.petName}`,
        status: a.status,
        href: "/dashboard/spa",
        createdAt: a.createdAt,
        isNew: true,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pendingOrders: pendingOrders[0].count,
        total: notifications.length,
      },
    });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
