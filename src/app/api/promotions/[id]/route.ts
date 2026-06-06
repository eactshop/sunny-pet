import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB = process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet";
const nowVN = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const conn = await mysql.createConnection(DB);
  try {
    const { id } = await params;
    const [rows]: any = await conn.execute(
      `SELECT p.*, (SELECT COUNT(*) FROM \`Order\` o WHERE o.promotionId=p.id) as usedCount
       FROM Promotion p WHERE p.id=?`, [id]
    );
    await conn.end();
    if (!rows.length) return NextResponse.json({ success: false, error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const conn = await mysql.createConnection(DB);
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, code, type, value, minOrder, maxDiscount, maxUses, startDate, endDate, active } = body;

    if (!name || !code || !type || !value || !startDate || !endDate) {
      await conn.end();
      return NextResponse.json({ success: false, error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Kiểm tra trùng code (trừ chính nó)
    const [exist]: any = await conn.execute(
      "SELECT id FROM Promotion WHERE code=? AND id!=?", [code.toUpperCase(), id]
    );
    if (exist.length) {
      await conn.end();
      return NextResponse.json({ success: false, error: "Mã voucher đã tồn tại" }, { status: 409 });
    }

    await conn.execute(
      `UPDATE Promotion SET code=?, name=?, type=?, value=?, minOrder=?, maxDiscount=?, maxUses=?,
       startDate=?, endDate=?, active=?, updatedAt=? WHERE id=?`,
      [code.toUpperCase(), name, type, Number(value), Number(minOrder) || null,
       Number(maxDiscount) || null, Number(maxUses) || null,
       startDate, endDate, active ? 1 : 0, nowVN(), id]
    );
    const [updated]: any = await conn.execute(
      `SELECT p.*, (SELECT COUNT(*) FROM \`Order\` o WHERE o.promotionId=p.id) as usedCount FROM Promotion p WHERE p.id=?`, [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const conn = await mysql.createConnection(DB);
  try {
    const { id } = await params;
    // Không xóa nếu đã có đơn dùng
    const [orders]: any = await conn.execute("SELECT COUNT(*) as c FROM `Order` WHERE promotionId=?", [id]);
    if (orders[0].c > 0) {
      await conn.end();
      return NextResponse.json({ success: false, error: `Voucher đã được dùng ${orders[0].c} lần, không thể xóa. Hãy tắt hoạt động thay thế.` }, { status: 400 });
    }
    await conn.execute("DELETE FROM Promotion WHERE id=?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: { message: "Đã xóa voucher" } });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
