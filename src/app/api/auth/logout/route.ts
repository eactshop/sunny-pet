import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, data: { message: "Đã đăng xuất" } });
  res.cookies.set("token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "strict",
  });
  return res;
}