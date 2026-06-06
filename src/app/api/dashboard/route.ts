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
    const reportType = searchParams.get("reportType") || "overview"; // overview | day | week | month | year
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString().slice(0, 19).replace("T", " ");
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().slice(0, 19).replace("T", " ");

    // ─── OVERVIEW STATS ───────────────────────────────────────
    const [todayOrders]: any = await conn.execute(
      `SELECT COALESCE(SUM(total),0) as r FROM \`Order\` WHERE status='COMPLETED' AND createdAt>=?`, [todayStart]);
    const [todaySpa]: any = await conn.execute(
      `SELECT COALESCE(SUM(price),0) as r FROM Appointment WHERE status='COMPLETED' AND createdAt>=?`, [todayStart]);
    const [monthOrders]: any = await conn.execute(
      `SELECT COALESCE(SUM(total),0) as r FROM \`Order\` WHERE status='COMPLETED' AND createdAt>=?`, [monthStart]);
    const [monthSpa]: any = await conn.execute(
      `SELECT COALESCE(SUM(price),0) as r FROM Appointment WHERE status='COMPLETED' AND createdAt>=?`, [monthStart]);
    const [totalOrders]: any = await conn.execute(
      `SELECT COUNT(*) as c FROM \`Order\` WHERE createdAt>=? AND status NOT IN ('CANCELLED')`, [monthStart]);
    const [shippingOrders]: any = await conn.execute(
      `SELECT COUNT(*) as c FROM \`Order\` WHERE status='SHIPPING'`);
    const [returnedOrders]: any = await conn.execute(
      `SELECT COUNT(*) as c FROM \`Order\` WHERE status='RETURNED' AND createdAt>=?`, [monthStart]);
    const [returnedRevMonth]: any = await conn.execute(
      `SELECT COALESCE(SUM(total),0) as r FROM \`Order\` WHERE status='RETURNED' AND createdAt>=?`, [monthStart]);
    const [cancelledOrders]: any = await conn.execute(
      `SELECT COUNT(*) as c FROM \`Order\` WHERE status='CANCELLED' AND createdAt>=?`, [monthStart]);
    const [returnedRevToday]: any = await conn.execute(
      `SELECT COALESCE(SUM(total),0) as r FROM \`Order\` WHERE status='RETURNED' AND createdAt>=?`, [todayStart]);
    const [newCustomers]: any = await conn.execute(
      `SELECT COUNT(*) as c FROM Customer WHERE createdAt>=?`, [monthStart]);
    const [todaySpaCount]: any = await conn.execute(
      `SELECT COUNT(*) as c FROM Appointment WHERE DATE(date)=CURDATE()`);

    // ─── PAYMENT METHOD STATS (Order + Spa, tất cả trừ hủy/hoàn) ──
    const [pmTodayOrder]: any = await conn.execute(
      `SELECT paymentMethod, COALESCE(SUM(total),0) as r, COUNT(*) as c FROM \`Order\`
       WHERE status NOT IN ('CANCELLED','RETURNED') AND createdAt>=? GROUP BY paymentMethod`, [todayStart]);
    const [pmMonthOrder]: any = await conn.execute(
      `SELECT paymentMethod, COALESCE(SUM(total),0) as r, COUNT(*) as c FROM \`Order\`
       WHERE status NOT IN ('CANCELLED','RETURNED') AND createdAt>=? GROUP BY paymentMethod`, [monthStart]);
    const [pmTodaySpa]: any = await conn.execute(
      `SELECT 'CASH' as paymentMethod, COALESCE(SUM(price),0) as r, COUNT(*) as c FROM Appointment
       WHERE status NOT IN ('CANCELLED') AND createdAt>=?`, [todayStart]);
    const [pmMonthSpa]: any = await conn.execute(
      `SELECT 'CASH' as paymentMethod, COALESCE(SUM(price),0) as r, COUNT(*) as c FROM Appointment
       WHERE status NOT IN ('CANCELLED') AND createdAt>=?`, [monthStart]);
    const todayPM = { CASH: { r: 0, c: 0 }, BANK_TRANSFER: { r: 0, c: 0 } } as Record<string, {r:number,c:number}>;
    const monthPM = { CASH: { r: 0, c: 0 }, BANK_TRANSFER: { r: 0, c: 0 } } as Record<string, {r:number,c:number}>;
    for (const row of [...pmTodayOrder, ...pmTodaySpa]) {
      if (!todayPM[row.paymentMethod]) todayPM[row.paymentMethod] = { r: 0, c: 0 };
      todayPM[row.paymentMethod].r += Number(row.r); todayPM[row.paymentMethod].c += Number(row.c);
    }
    for (const row of [...pmMonthOrder, ...pmMonthSpa]) {
      if (!monthPM[row.paymentMethod]) monthPM[row.paymentMethod] = { r: 0, c: 0 };
      monthPM[row.paymentMethod].r += Number(row.r); monthPM[row.paymentMethod].c += Number(row.c);
    }

    // ─── REVENUE CHART (7 ngày) ───────────────────────────────
    const revenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,19).replace("T"," ");
      const de = new Date(d.getFullYear(), d.getMonth(), d.getDate()+1).toISOString().slice(0,19).replace("T"," ");
      const [or]: any = await conn.execute(`SELECT COALESCE(SUM(total),0) as r FROM \`Order\` WHERE status='COMPLETED' AND createdAt>=? AND createdAt<?`, [ds,de]);
      const [sr]: any = await conn.execute(`SELECT COALESCE(SUM(price),0) as r FROM Appointment WHERE status='COMPLETED' AND createdAt>=? AND createdAt<?`, [ds,de]);
      const days = ["CN","T2","T3","T4","T5","T6","T7"];
      revenueChart.push({ day: days[d.getDay()], date: d.toISOString().slice(0,10), orderRevenue: Number(or[0].r), spaRevenue: Number(sr[0].r), revenue: Number(or[0].r)+Number(sr[0].r) });
    }

    // ─── REPORT DATA ──────────────────────────────────────────
    let reportData = null;
    if (reportType !== "overview") {
      let groupBy = "", dateFormat = "", rangeStart = "", rangeEnd = "";
      const now2 = new Date();

      if (reportType === "day") {
        // 30 ngày gần đây
        const d30 = new Date(now2); d30.setDate(d30.getDate() - 29);
        rangeStart = d30.toISOString().slice(0,10) + " 00:00:00";
        rangeEnd = now2.toISOString().slice(0,10) + " 23:59:59";
        groupBy = "DATE(createdAt)";
        dateFormat = "%d/%m";
      } else if (reportType === "week") {
        // 12 tuần gần đây
        const w12 = new Date(now2); w12.setDate(w12.getDate() - 83);
        rangeStart = w12.toISOString().slice(0,10) + " 00:00:00";
        rangeEnd = now2.toISOString().slice(0,10) + " 23:59:59";
        groupBy = "YEARWEEK(createdAt, 1)";
        dateFormat = "T%u";
      } else if (reportType === "month") {
        // 12 tháng gần đây
        const m12 = new Date(now2); m12.setMonth(m12.getMonth() - 11); m12.setDate(1);
        rangeStart = m12.toISOString().slice(0,10) + " 00:00:00";
        rangeEnd = now2.toISOString().slice(0,10) + " 23:59:59";
        groupBy = "DATE_FORMAT(createdAt, '%Y-%m')";
        dateFormat = "%m/%Y";
      } else if (reportType === "year") {
        // 5 năm gần đây
        const y5 = new Date(now2); y5.setFullYear(y5.getFullYear() - 4); y5.setMonth(0); y5.setDate(1);
        rangeStart = y5.toISOString().slice(0,10) + " 00:00:00";
        rangeEnd = now2.toISOString().slice(0,10) + " 23:59:59";
        groupBy = "YEAR(createdAt)";
        dateFormat = "%Y";
      }

      // Dùng from/to nếu có
      if (from) rangeStart = from + " 00:00:00";
      if (to) rangeEnd = to + " 23:59:59";

      // Orders revenue by period
      let orderQuery = "";
      let spaQuery = "";
      if (reportType === "day") {
        orderQuery = `SELECT DATE_FORMAT(createdAt,'${dateFormat}') as label, DATE(createdAt) as period, COALESCE(SUM(total),0) as revenue, COUNT(*) as count FROM \`Order\` WHERE status='COMPLETED' AND createdAt BETWEEN ? AND ? GROUP BY DATE(createdAt), DATE_FORMAT(createdAt,'${dateFormat}') ORDER BY period ASC`;
        spaQuery = `SELECT DATE_FORMAT(createdAt,'${dateFormat}') as label, DATE(createdAt) as period, COALESCE(SUM(price),0) as revenue, COUNT(*) as count FROM Appointment WHERE status='COMPLETED' AND createdAt BETWEEN ? AND ? GROUP BY DATE(createdAt), DATE_FORMAT(createdAt,'${dateFormat}') ORDER BY period ASC`;
      } else if (reportType === "week") {
        orderQuery = `SELECT CONCAT('T',WEEK(createdAt,1)) as label, YEARWEEK(createdAt,1) as period, COALESCE(SUM(total),0) as revenue, COUNT(*) as count FROM \`Order\` WHERE status='COMPLETED' AND createdAt BETWEEN ? AND ? GROUP BY YEARWEEK(createdAt,1), CONCAT('T',WEEK(createdAt,1)) ORDER BY period ASC`;
        spaQuery = `SELECT CONCAT('T',WEEK(createdAt,1)) as label, YEARWEEK(createdAt,1) as period, COALESCE(SUM(price),0) as revenue, COUNT(*) as count FROM Appointment WHERE status='COMPLETED' AND createdAt BETWEEN ? AND ? GROUP BY YEARWEEK(createdAt,1), CONCAT('T',WEEK(createdAt,1)) ORDER BY period ASC`;
      } else if (reportType === "month") {
        orderQuery = `SELECT DATE_FORMAT(createdAt,'%m/%Y') as label, DATE_FORMAT(createdAt,'%Y-%m') as period, COALESCE(SUM(total),0) as revenue, COUNT(*) as count FROM \`Order\` WHERE status='COMPLETED' AND createdAt BETWEEN ? AND ? GROUP BY DATE_FORMAT(createdAt,'%Y-%m'), DATE_FORMAT(createdAt,'%m/%Y') ORDER BY period ASC`;
        spaQuery = `SELECT DATE_FORMAT(createdAt,'%m/%Y') as label, DATE_FORMAT(createdAt,'%Y-%m') as period, COALESCE(SUM(price),0) as revenue, COUNT(*) as count FROM Appointment WHERE status='COMPLETED' AND createdAt BETWEEN ? AND ? GROUP BY DATE_FORMAT(createdAt,'%Y-%m'), DATE_FORMAT(createdAt,'%m/%Y') ORDER BY period ASC`;
      } else {
        orderQuery = `SELECT YEAR(createdAt) as label, YEAR(createdAt) as period, COALESCE(SUM(total),0) as revenue, COUNT(*) as count FROM \`Order\` WHERE status='COMPLETED' AND createdAt BETWEEN ? AND ? GROUP BY YEAR(createdAt), YEAR(createdAt) ORDER BY period ASC`;
        spaQuery = `SELECT YEAR(createdAt) as label, YEAR(createdAt) as period, COALESCE(SUM(price),0) as revenue, COUNT(*) as count FROM Appointment WHERE status='COMPLETED' AND createdAt BETWEEN ? AND ? GROUP BY YEAR(createdAt), YEAR(createdAt) ORDER BY period ASC`;
      }

      const [orderRevData]: any = await conn.execute(orderQuery, [rangeStart, rangeEnd]);
      const [spaRevData]: any = await conn.execute(spaQuery, [rangeStart, rangeEnd]);

      // Payment method breakdown for the period (tất cả trừ hủy/hoàn)
      const [pmBreakdownOrder]: any = await conn.execute(
        `SELECT paymentMethod, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
         FROM \`Order\` WHERE status NOT IN ('CANCELLED','RETURNED') AND createdAt BETWEEN ? AND ?
         GROUP BY paymentMethod`, [rangeStart, rangeEnd]);
      const [pmBreakdownSpa]: any = await conn.execute(
        `SELECT 'CASH' as paymentMethod, COALESCE(SUM(price),0) as revenue, COUNT(*) as count
         FROM Appointment WHERE status NOT IN ('CANCELLED') AND createdAt BETWEEN ? AND ?`,
        [rangeStart, rangeEnd]);
      const pmAgg: Record<string, {revenue:number,count:number}> = { CASH:{revenue:0,count:0}, BANK_TRANSFER:{revenue:0,count:0} };
      for (const r of [...pmBreakdownOrder, ...pmBreakdownSpa]) {
        if (!pmAgg[r.paymentMethod]) pmAgg[r.paymentMethod] = {revenue:0,count:0};
        pmAgg[r.paymentMethod].revenue += Number(r.revenue);
        pmAgg[r.paymentMethod].count += Number(r.count);
      }
      const pmSummary = {
        cashRevenue: pmAgg.CASH.revenue, cashCount: pmAgg.CASH.count,
        bankRevenue: pmAgg.BANK_TRANSFER.revenue, bankCount: pmAgg.BANK_TRANSFER.count,
      };

      // Merge by label
      const merged: Record<string, any> = {};
      for (const r of orderRevData) {
        merged[r.label] = { label: String(r.label), orderRevenue: Number(r.revenue), orderCount: Number(r.count), spaRevenue: 0, spaCount: 0 };
      }
      for (const r of spaRevData) {
        const lb = String(r.label);
        if (!merged[lb]) merged[lb] = { label: lb, orderRevenue: 0, orderCount: 0, spaRevenue: 0, spaCount: 0 };
        merged[lb].spaRevenue = Number(r.revenue);
        merged[lb].spaCount = Number(r.count);
      }
      const chartData = Object.values(merged).map((r: any) => ({
        ...r,
        total: r.orderRevenue + r.spaRevenue,
      })).sort((a: any, b: any) => String(a.label).localeCompare(String(b.label)));

      // Summary
      const totalOrderRev = chartData.reduce((s: number, r: any) => s + r.orderRevenue, 0);
      const totalSpaRev = chartData.reduce((s: number, r: any) => s + r.spaRevenue, 0);
      const totalOrderCount = chartData.reduce((s: number, r: any) => s + r.orderCount, 0);
      const totalSpaCount = chartData.reduce((s: number, r: any) => s + r.spaCount, 0);

      reportData = { chartData, totalOrderRev, totalSpaRev, totalRev: totalOrderRev + totalSpaRev, totalOrderCount, totalSpaCount, pmSummary };
    }

    // ─── TOP PRODUCTS ─────────────────────────────────────────
    const [topProducts]: any = await conn.execute(
      `SELECT p.name, p.code, SUM(oi.quantity) as sold, SUM(oi.subtotal) as revenue
       FROM OrderItem oi LEFT JOIN Product p ON oi.productId=p.id
       LEFT JOIN \`Order\` o ON oi.orderId=o.id WHERE o.status='COMPLETED'
       GROUP BY oi.productId ORDER BY sold DESC LIMIT 5`);

    // ─── RECENT ORDERS ────────────────────────────────────────
    const [recentOrders]: any = await conn.execute(
      `SELECT o.*, c.name as customerName FROM \`Order\` o
       LEFT JOIN Customer c ON o.customerId=c.id ORDER BY o.createdAt DESC LIMIT 5`);

    // ─── UPCOMING SPA ─────────────────────────────────────────
    const [upcomingSpa]: any = await conn.execute(
      `SELECT a.*, c.name as customerName, p.name as petName, s.name as serviceName
       FROM Appointment a LEFT JOIN Customer c ON a.customerId=c.id
       LEFT JOIN Pet p ON a.petId=p.id LEFT JOIN Service s ON a.serviceId=s.id
       WHERE DATE(a.date)=CURDATE() ORDER BY a.date ASC LIMIT 5`);

    // ─── LOW STOCK ────────────────────────────────────────────
    const [lowStock]: any = await conn.execute(
      `SELECT id, code, name, stock, minStock FROM Product WHERE active=1 AND stock<=minStock ORDER BY stock ASC LIMIT 5`);

    await conn.end();
    return NextResponse.json({
      success: true,
      data: {
        todayRevenue: Number(todayOrders[0].r) + Number(todaySpa[0].r),
        monthRevenue: Number(monthOrders[0].r) + Number(monthSpa[0].r),
        todayOrderRevenue: Number(todayOrders[0].r),
        todaySpaRevenue: Number(todaySpa[0].r),
        monthOrderRevenue: Number(monthOrders[0].r),
        monthSpaRevenue: Number(monthSpa[0].r),
        totalOrders: Number(totalOrders[0].c),
        shippingOrders: Number(shippingOrders[0].c),
        returnedOrders: Number(returnedOrders[0].c),
        cancelledOrders: Number(cancelledOrders[0].c),
        returnedRevMonth: Number(returnedRevMonth[0].r),
        returnedRevToday: Number(returnedRevToday[0].r),
        netMonthRevenue: Number(monthOrders[0].r) + Number(monthSpa[0].r) - Number(returnedRevMonth[0].r),
        netTodayRevenue: Number(todayOrders[0].r) + Number(todaySpa[0].r) - Number(returnedRevToday[0].r),
        newCustomers: Number(newCustomers[0].c),
        todaySpaCount: Number(todaySpaCount[0].c),
        todayCashRevenue: todayPM.CASH.r, todayCashCount: todayPM.CASH.c,
        todayBankRevenue: todayPM.BANK_TRANSFER.r, todayBankCount: todayPM.BANK_TRANSFER.c,
        monthCashRevenue: monthPM.CASH.r, monthCashCount: monthPM.CASH.c,
        monthBankRevenue: monthPM.BANK_TRANSFER.r, monthBankCount: monthPM.BANK_TRANSFER.c,
        revenueChart,
        reportData,
        topProducts,
        recentOrders,
        upcomingSpa,
        lowStock,
      }
    });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}