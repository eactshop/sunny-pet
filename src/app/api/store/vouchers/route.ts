import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const conn = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet"
  );
  try {
    const { searchParams } = new URL(req.url);
    const total = Number(searchParams.get("total") || 0);

    const [rows]: any = await conn.execute(
      `SELECT p.*,
        (SELECT COUNT(*) FROM \`Order\` o WHERE o.promotionId = p.id) as usedCount
       FROM Promotion p
       WHERE p.active = 1
         AND p.startDate <= NOW()
         AND p.endDate >= NOW()
       ORDER BY p.value DESC`
    );
    await conn.end();

    // Lọc theo minOrder và maxUses, tính discount cho từng voucher
    const available = rows
      .filter((v: any) => {
        if (v.minOrder && total < v.minOrder) return false;
        if (v.maxUses && v.usedCount >= v.maxUses) return false;
        return true;
      })
      .map((v: any) => {
        let discountAmount = 0;
        if (v.type === "PERCENT") {
          discountAmount = (total * v.value) / 100;
          if (v.maxDiscount) discountAmount = Math.min(discountAmount, v.maxDiscount);
        } else {
          discountAmount = v.value;
        }
        discountAmount = Math.round(Math.min(discountAmount, total));
        return { ...v, discountAmount };
      });

    // Voucher không đủ điều kiện (để hiển thị mờ)
    const unavailable = rows
      .filter((v: any) => {
        if (v.maxUses && v.usedCount >= v.maxUses) return false;
        return v.minOrder && total < v.minOrder;
      })
      .map((v: any) => ({
        ...v, discountAmount: 0,
        reason: `Đơn tối thiểu ${Number(v.minOrder).toLocaleString("vi-VN")}₫`,
      }));

    return NextResponse.json({
      success: true,
      data: { available, unavailable },
    });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
