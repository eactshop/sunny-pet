import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB_URL = "mysql://root:@localhost:3306/sunny_pet";

export async function GET() {
  try {
    const conn = await mysql.createConnection(DB_URL);
    const [rows]: any = await conn.execute(
      `SELECT c.*, COUNT(p.id) as productCount
       FROM Category c LEFT JOIN Product p ON p.categoryId = c.id AND p.active = 1
       GROUP BY c.id ORDER BY c.name ASC`
    );
    await conn.end();
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}