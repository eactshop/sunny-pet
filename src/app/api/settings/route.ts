import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// GET /api/settings
export async function GET() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const [users]: any = await conn.execute(
      "SELECT id, name, email, role, active, createdAt FROM User ORDER BY createdAt ASC"
    );
    await conn.end();
    return NextResponse.json({ success: true, data: { users } });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST /api/settings/users — thêm nhân viên
export async function POST(req: NextRequest) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) {
      await conn.end();
      return NextResponse.json({ success: false, error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 12);
    const id = Math.random().toString(36).slice(2, 26);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await conn.execute(
      `INSERT INTO User (id, name, email, password, role, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, name, email, hashed, role || "STAFF", now, now]
    );
    const [newUser]: any = await conn.execute(
      "SELECT id, name, email, role, active, createdAt FROM User WHERE id = ?", [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: newUser[0] }, { status: 201 });
  } catch (e: any) {
    await conn.end();
    if (e.code === "ER_DUP_ENTRY") return NextResponse.json({ success: false, error: "Email đã tồn tại" }, { status: 409 });
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// PATCH /api/settings — đổi mật khẩu hoặc toggle active
export async function PATCH(req: NextRequest) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const body = await req.json();
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Đổi mật khẩu
    if (body.action === "change_password") {
      const { userId, oldPassword, newPassword } = body;
      const [rows]: any = await conn.execute("SELECT password FROM User WHERE id = ?", [userId]);
      if (!rows.length) { await conn.end(); return NextResponse.json({ success: false, error: "Không tìm thấy user" }, { status: 404 }); }
      const valid = await bcrypt.compare(oldPassword, rows[0].password);
      if (!valid) { await conn.end(); return NextResponse.json({ success: false, error: "Mật khẩu hiện tại không đúng" }, { status: 400 }); }
      const hashed = await bcrypt.hash(newPassword, 12);
      await conn.execute("UPDATE User SET password=?, updatedAt=? WHERE id=?", [hashed, now, userId]);
      await conn.end();
      return NextResponse.json({ success: true, data: { message: "Đổi mật khẩu thành công" } });
    }

    // Toggle active
    if (body.action === "toggle_active") {
      const { userId, active } = body;
      await conn.execute("UPDATE User SET active=?, updatedAt=? WHERE id=?", [active ? 1 : 0, now, userId]);
      await conn.end();
      return NextResponse.json({ success: true, data: { message: "Cập nhật thành công" } });
    }

    // Đổi role
    if (body.action === "change_role") {
      const { userId, role } = body;
      await conn.execute("UPDATE User SET role=?, updatedAt=? WHERE id=?", [role, now, userId]);
      await conn.end();
      return NextResponse.json({ success: true, data: { message: "Cập nhật quyền thành công" } });
    }

    // Reset password by admin
    if (body.action === "reset_password") {
      const { userId, newPassword } = body;
      const hashed = await bcrypt.hash(newPassword, 12);
      await conn.execute("UPDATE User SET password=?, updatedAt=? WHERE id=?", [hashed, now, userId]);
      await conn.end();
      return NextResponse.json({ success: true, data: { message: "Đặt lại mật khẩu thành công" } });
    }

    await conn.end();
    return NextResponse.json({ success: false, error: "Action không hợp lệ" }, { status: 400 });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE /api/settings?userId=xxx
export async function DELETE(req: NextRequest) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) { await conn.end(); return NextResponse.json({ success: false, error: "Thiếu userId" }, { status: 400 }); }
    await conn.execute("DELETE FROM User WHERE id = ?", [userId]);
    await conn.end();
    return NextResponse.json({ success: true, data: { message: "Đã xóa tài khoản" } });
  } catch (e: any) {
    await conn.end();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}