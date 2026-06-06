import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const dynamic = "force-dynamic";

const DB = {
  host: "localhost", port: 3306,
  user: "root", password: "", database: "sunny_pet",
};

export async function GET(req: NextRequest) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const from = searchParams.get("from") || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = searchParams.get("to") || now.toISOString().slice(0, 10);
    const groupBy = searchParams.get("groupBy") || "day";

    const rangeStart = from + " 00:00:00";
    const rangeEnd = to + " 23:59:59";

    let dateExpr = "DATE(createdAt)";
    if (groupBy === "month") dateExpr = "DATE_FORMAT(createdAt,'%Y-%m')";
    else if (groupBy === "year") dateExpr = "YEAR(createdAt)";

    // Orders by period
    const [orderRows]: any = await conn.execute(
      `SELECT ${dateExpr} as period,
        COALESCE(SUM(CASE WHEN status='COMPLETED' THEN total ELSE 0 END),0) as revenue,
        COALESCE(SUM(CASE WHEN status='RETURNED'  THEN total ELSE 0 END),0) as returnedRevenue,
        COALESCE(SUM(CASE WHEN status='CANCELLED' THEN total ELSE 0 END),0) as cancelledRevenue,
        COUNT(*) as count,
        SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status='RETURNED'  THEN 1 ELSE 0 END) as returned,
        SUM(CASE WHEN status='CANCELLED' THEN 1 ELSE 0 END) as cancelled
       FROM \`Order\`
       WHERE createdAt BETWEEN ? AND ?
       GROUP BY ${dateExpr} ORDER BY period ASC`,
      [rangeStart, rangeEnd]
    );

    // Spa by period
    const [spaRows]: any = await conn.execute(
      `SELECT ${dateExpr} as period,
        COALESCE(SUM(price),0) as revenue,
        COUNT(*) as count,
        SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) as completed
       FROM Appointment
       WHERE createdAt BETWEEN ? AND ?
       GROUP BY ${dateExpr} ORDER BY period ASC`,
      [rangeStart, rangeEnd]
    );

    // Merge
    const merged: Record<string, any> = {};
    for (const r of orderRows) {
      const key = String(r.period);
      merged[key] = {
        period: key,
        orderRevenue: Number(r.revenue),
        orderReturnedRevenue: Number(r.returnedRevenue),
        orderCancelledRevenue: Number(r.cancelledRevenue),
        orderNetRevenue: Number(r.revenue) - Number(r.returnedRevenue),
        orderCount: Number(r.count),
        orderCompleted: Number(r.completed),
        orderReturned: Number(r.returned),
        orderCancelled: Number(r.cancelled),
        spaRevenue: 0, spaCount: 0, spaCompleted: 0,
      };
    }
    for (const r of spaRows) {
      const key = String(r.period);
      if (!merged[key]) merged[key] = { period: key, orderRevenue: 0, orderReturnedRevenue: 0, orderCancelledRevenue: 0, orderNetRevenue: 0, orderCount: 0, orderCompleted: 0, orderReturned: 0, orderCancelled: 0 };
      merged[key].spaRevenue = Number(r.revenue);
      merged[key].spaCount = Number(r.count);
      merged[key].spaCompleted = Number(r.completed);
    }

    const chartData = Object.values(merged).map((r: any) => {
      let label = r.period;
      if (groupBy === "day") {
        try { label = new Date(r.period).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }); } catch { }
      } else if (groupBy === "month") {
        label = r.period.slice(5, 7) + "/" + r.period.slice(0, 4);
      }
      return {
        ...r, label,
        totalRevenue: r.orderRevenue + r.spaRevenue,
        totalReturnedRevenue: r.orderReturnedRevenue || 0,
        netRevenue: (r.orderRevenue - (r.orderReturnedRevenue || 0)) + (r.spaRevenue || 0),
      };
    }).sort((a: any, b: any) => String(a.period).localeCompare(String(b.period)));

    // Summary
    const totalOrderRev = chartData.reduce((s, r) => s + r.orderRevenue, 0);
    const totalSpaRev = chartData.reduce((s, r) => s + r.spaRevenue, 0);
    const totalReturnedRev = chartData.reduce((s, r) => s + (r.orderReturnedRevenue || 0), 0);
    const totalCancelledRev = chartData.reduce((s, r) => s + (r.orderCancelledRevenue || 0), 0);
    const totalNetRev = totalOrderRev - totalReturnedRev + totalSpaRev;
    const totalOrderCount = chartData.reduce((s, r) => s + r.orderCount, 0);
    const totalOrderCompleted = chartData.reduce((s, r) => s + r.orderCompleted, 0);
    const totalOrderReturned = chartData.reduce((s, r) => s + r.orderReturned, 0);
    const totalOrderCancelled = chartData.reduce((s, r) => s + r.orderCancelled, 0);
    const totalSpaCount = chartData.reduce((s, r) => s + r.spaCount, 0);
    const totalSpaCompleted = chartData.reduce((s, r) => s + r.spaCompleted, 0);

    // Top products
    const [topProducts]: any = await conn.execute(
      `SELECT p.id, p.name, p.code, c.name as categoryName,
        SUM(oi.quantity) as sold, SUM(oi.subtotal) as revenue
       FROM OrderItem oi
       LEFT JOIN Product p ON oi.productId = p.id
       LEFT JOIN \`Order\` o ON oi.orderId = o.id
       LEFT JOIN Category c ON p.categoryId = c.id
       WHERE o.status = 'COMPLETED' AND o.createdAt BETWEEN ? AND ?
       GROUP BY oi.productId, p.id, p.name, p.code, c.name
       ORDER BY sold DESC LIMIT 10`,
      [rangeStart, rangeEnd]
    );

    // Top customers
    const [topCustomers]: any = await conn.execute(
      `SELECT c.id, c.name, c.phone,
    COUNT(DISTINCT o.id) as orderCount,
    COALESCE(SUM(CASE WHEN o.status='COMPLETED' THEN o.total ELSE 0 END),0) as orderSpent,
    COUNT(DISTINCT a.id) as spaCount,
    COALESCE(SUM(CASE WHEN a.status='COMPLETED' THEN a.price ELSE 0 END),0) as spaSpent
   FROM Customer c
   LEFT JOIN \`Order\` o ON o.customerId = c.id AND o.createdAt BETWEEN ? AND ?
   LEFT JOIN Appointment a ON a.customerId = c.id AND a.createdAt BETWEEN ? AND ?
   GROUP BY c.id, c.name, c.phone
   HAVING COUNT(DISTINCT o.id) > 0 OR COUNT(DISTINCT a.id) > 0
   ORDER BY (
     COALESCE(SUM(CASE WHEN o.status='COMPLETED' THEN o.total ELSE 0 END),0) +
     COALESCE(SUM(CASE WHEN a.status='COMPLETED' THEN a.price ELSE 0 END),0)
   ) DESC LIMIT 10`,
      [rangeStart, rangeEnd, rangeStart, rangeEnd]
    );

    // Top services
    const [topServices]: any = await conn.execute(
      `SELECT s.name, COUNT(a.id) as count, COALESCE(SUM(a.price),0) as revenue
       FROM Appointment a
       LEFT JOIN Service s ON a.serviceId = s.id
       WHERE a.status = 'COMPLETED' AND a.createdAt BETWEEN ? AND ?
       GROUP BY a.serviceId, s.name ORDER BY count DESC`,
      [rangeStart, rangeEnd]
    );

    // Payment method breakdown (tất cả đơn trừ hủy/hoàn hàng)
    const [pmOrderData]: any = await conn.execute(
      `SELECT paymentMethod, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
       FROM \`Order\` WHERE status NOT IN ('CANCELLED','RETURNED') AND createdAt BETWEEN ? AND ?
       GROUP BY paymentMethod`, [rangeStart, rangeEnd]
    );
    const [pmSpaData]: any = await conn.execute(
      `SELECT 'CASH' as paymentMethod, COALESCE(SUM(price),0) as revenue, COUNT(*) as count
       FROM Appointment WHERE status NOT IN ('CANCELLED') AND createdAt BETWEEN ? AND ?`,
      [rangeStart, rangeEnd]
    );
    const pmAgg: Record<string, {revenue:number,count:number}> = { CASH: {revenue:0,count:0}, BANK_TRANSFER: {revenue:0,count:0} };
    for (const r of [...pmOrderData, ...pmSpaData]) {
      if (!pmAgg[r.paymentMethod]) pmAgg[r.paymentMethod] = {revenue:0,count:0};
      pmAgg[r.paymentMethod].revenue += Number(r.revenue);
      pmAgg[r.paymentMethod].count += Number(r.count);
    }
    const paymentSummary = {
      cashRevenue: pmAgg.CASH.revenue, cashCount: pmAgg.CASH.count,
      bankRevenue: pmAgg.BANK_TRANSFER.revenue, bankCount: pmAgg.BANK_TRANSFER.count,
    };

    await conn.end();
    return NextResponse.json({
      success: true,
      data: {
        chartData,
        summary: {
          totalRevenue: totalOrderRev + totalSpaRev,
          totalReturnedRev, totalCancelledRev, totalNetRev,
          totalOrderRev, totalSpaRev,
          totalOrderCount, totalOrderCompleted, totalOrderReturned, totalOrderCancelled,
          totalSpaCount, totalSpaCompleted,
          conversionRate: totalOrderCount > 0 ? Math.round(totalOrderCompleted / totalOrderCount * 100) : 0,
          ...paymentSummary,
        },
        topProducts,
        topCustomers,
        topServices,
        from, to, groupBy,
      }
    });
  } catch (e: any) {
    await conn.end();
    console.error("Reports error:", e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}