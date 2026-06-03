import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const payload = verifyToken(token);
    return NextResponse.json({ success: true, data: payload });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }
}