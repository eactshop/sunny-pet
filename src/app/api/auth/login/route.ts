import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DB_URL = "mysql://root:@localhost:3306/sunny_pet";
const JWT_SECRET = process.env.JWT_SECRET || "sunnypet-secret-key-2025";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập email và mật khẩu" }, { status: 400 });
    }

    const conn = await mysql.createConnection(DB_URL);
    const [rows]: any = await conn.execute(
      "SELECT id, email, password, name, role, active FROM User WHERE email = ? LIMIT 1",
      [email]
    );
    await conn.end();

    if (!rows.length || !rows[0].active) {
      return NextResponse.json({ success: false, error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Email hoặc mật khẩu không đúng" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "strict",
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Lỗi server, thử lại sau" }, { status: 500 });
  }
}