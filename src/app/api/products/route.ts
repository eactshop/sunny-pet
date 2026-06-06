import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB_URL = "mysql://root:@localhost:3306/sunny_pet";

// GET /api/products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 50);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const offset = (page - 1) * limit;

    const conn = await mysql.createConnection(DB_URL);

    let where = "WHERE p.active = 1";
    const params: any[] = [];

    if (search) {
      where += " AND (p.name LIKE ? OR p.code LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      where += " AND p.categoryId = ?";
      params.push(categoryId);
    }

    const [items]: any = await conn.execute(
      `SELECT p.*, c.name as categoryName FROM Product p
       LEFT JOIN Category c ON p.categoryId = c.id
       ${where} ORDER BY p.createdAt DESC LIMIT ${parseInt(String(limit))} OFFSET ${parseInt(String(offset))}`,
      params
    );

    const [countResult]: any = await conn.execute(
      `SELECT COUNT(*) as total FROM Product p ${where}`,
      params
    );

    await conn.end();

    return NextResponse.json({
      success: true,
      data: {
        items,
        total: countResult[0].total,
        page,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, buyPrice, sellPrice, salePrice, stock, minStock, categoryId, image } = body;

    if (!name || !buyPrice || !sellPrice || !categoryId) {
      return NextResponse.json({ success: false, error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const conn = await mysql.createConnection(DB_URL);

    // Generate code
    // Generate unique code
    const [allCodes]: any = await conn.execute("SELECT code FROM Product ORDER BY createdAt DESC");
    const nums = allCodes.map((r: any) => parseInt(r.code.replace("SP", "")) || 0);
    const maxNum = nums.length ? Math.max(...nums) : 0;
    const code = `SP${String(maxNum + 1).padStart(3, "0")}`;

    const id = Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const salePriceVal = salePrice !== undefined && salePrice !== "" ? Number(salePrice) : null;
    await conn.execute(
      `INSERT INTO Product (id, code, name, description, buyPrice, sellPrice, salePrice, stock, minStock, image, categoryId, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, code, name, description || null, buyPrice, sellPrice, salePriceVal, stock || 0, minStock || 5, image || null, categoryId, now, now]
    );

    const [newProduct]: any = await conn.execute(
      `SELECT p.*, c.name as categoryName FROM Product p
       LEFT JOIN Category c ON p.categoryId = c.id WHERE p.id = ?`,
      [id]
    );

    await conn.end();
    return NextResponse.json({ success: true, data: newProduct[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}