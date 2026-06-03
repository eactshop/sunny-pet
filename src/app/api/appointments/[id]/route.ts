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

export async function PATCH(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(DB);
  try {
    const { id } = await context.params;
    const { status } = await req.json();
    const valid = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!valid.includes(status)) { await conn.end(); return NextResponse.json({ success: false, error: "Trạng thái không hợp lệ" }, { status: 400 }); }

    const [apptRows]: any = await conn.execute("SELECT * FROM Appointment WHERE id=?", [id]);
    if (!apptRows.length) { await conn.end(); return NextResponse.json({ success: false, error: "Không tìm thấy" }, { status: 404 }); }
    const appt = apptRows[0];
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (status === "COMPLETED" && appt.status !== "COMPLETED") {
      await conn.execute(`UPDATE Customer SET totalSpent=totalSpent+?, updatedAt=? WHERE id=?`, [appt.price, now, appt.customerId]);
    }
    if (status === "CANCELLED" && appt.status === "COMPLETED") {
      await conn.execute(`UPDATE Customer SET totalSpent=totalSpent-?, updatedAt=? WHERE id=?`, [appt.price, now, appt.customerId]);
    }

    await conn.execute("UPDATE Appointment SET status=? WHERE id=?", [status, id]);
    const [updated]: any = await conn.execute(
      `SELECT a.*, c.name as customerName, p.name as petName, s.name as serviceName
       FROM Appointment a LEFT JOIN Customer c ON a.customerId=c.id
       LEFT JOIN Pet p ON a.petId=p.id LEFT JOIN Service s ON a.serviceId=s.id WHERE a.id=?`, [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(DB);
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { customerId, petId, serviceId, date, note, price } = body;
    const newPrice = Number(price) || 0;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const [oldRows]: any = await conn.execute("SELECT * FROM Appointment WHERE id=?", [id]);
    if (oldRows.length > 0 && oldRows[0].status === "COMPLETED") {
      const diff = newPrice - Number(oldRows[0].price);
      if (diff !== 0) await conn.execute(`UPDATE Customer SET totalSpent=totalSpent+?, updatedAt=? WHERE id=?`, [diff, now, oldRows[0].customerId]);
    }

    await conn.execute(
      `UPDATE Appointment SET customerId=?, petId=?, serviceId=?, date=?, note=?, price=? WHERE id=?`,
      [customerId, petId, serviceId, new Date(date).toISOString().slice(0,19).replace("T"," "), note||null, newPrice, id]
    );
    const [updated]: any = await conn.execute(
      `SELECT a.*, c.name as customerName, c.phone as customerPhone, p.name as petName, p.species as petSpecies,
        s.name as serviceName, s.duration as serviceDuration
       FROM Appointment a LEFT JOIN Customer c ON a.customerId=c.id
       LEFT JOIN Pet p ON a.petId=p.id LEFT JOIN Service s ON a.serviceId=s.id WHERE a.id=?`, [id]
    );
    await conn.end();
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, context: any) {
  const conn = await mysql.createConnection(DB);
  try {
    const user = await checkOwner();
    if (!user) { await conn.end(); return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); }
    if (user.role !== "OWNER") { await conn.end(); return NextResponse.json({ success: false, error: "Bạn không có quyền xóa!" }, { status: 403 }); }

    const { id } = await context.params;
    const [apptRows]: any = await conn.execute("SELECT * FROM Appointment WHERE id=?", [id]);
    if (apptRows.length > 0 && apptRows[0].status === "COMPLETED" && apptRows[0].price > 0) {
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      await conn.execute(`UPDATE Customer SET totalSpent=totalSpent-?, updatedAt=? WHERE id=?`, [apptRows[0].price, now, apptRows[0].customerId]);
    }
    await conn.execute("DELETE FROM Appointment WHERE id=?", [id]);
    await conn.end();
    return NextResponse.json({ success: true, data: { message: "Đã xóa lịch hẹn" } });
  } catch (e: any) { await conn.end(); return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}