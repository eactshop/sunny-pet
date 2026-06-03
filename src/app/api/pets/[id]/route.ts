// ============================================================
// FILE: src/app/api/pets/[id]/route.ts
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

const DB = { host: "localhost", port: 3306, user: "root", password: "", database: "sunny_pet" };

async function checkOwner() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch { return null; }
}

export async function PUT(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { name, species, breed, gender, birthDate, weight, note } = body;
    await conn.execute(
      `UPDATE Pet SET name=?, species=?, breed=?, gender=?, birthDate=?, weight=?, note=? WHERE id=?`,
      [name||null, species||null, breed||null, gender||null,
       birthDate ? new Date(birthDate).toISOString().slice(0,10) : null,
       weight ? Number(weight) : null, note||null, id]
    );
    const [updated]: any = await conn.execute(
      `SELECT p.*, c.name as ownerName FROM Pet p LEFT JOIN Customer c ON p.customerId=c.id WHERE p.id=?`, [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
  try {
    const user = await checkOwner();
    if (!user) { await conn.end(); return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); }
    if (user.role !== "OWNER") { await conn.end(); return NextResponse.json({ success: false, error: "Bạn không có quyền xóa!" }, { status: 403 }); }
    const { id } = await context.params;
    await conn.execute("DELETE FROM Appointment WHERE petId=?", [id]);
    await conn.execute("DELETE FROM Pet WHERE id=?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: { message: "Đã xóa thú cưng" } });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}