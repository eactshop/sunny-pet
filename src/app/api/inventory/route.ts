import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const DB = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "sunny_pet",
};

// GET /api/inventory
export async function GET(req: NextRequest) {
    const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
    try {
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get("page") || 1);
        const limit = Number(searchParams.get("limit") || 20);
        const type = searchParams.get("type") || "";
        const productId = searchParams.get("productId") || "";
        const offset = (page - 1) * limit;

        let where = "WHERE 1=1";
        const params: any[] = [];
        if (type) { where += " AND i.type = ?"; params.push(type); }
        if (productId) { where += " AND i.productId = ?"; params.push(productId); }

        const [items]: any = await conn.execute(
            `SELECT i.*, p.name as productName, p.code as productCode, s.name as supplierName
       FROM Inventory i
       LEFT JOIN Product p ON i.productId = p.id
       LEFT JOIN Supplier s ON i.supplierId = s.id
       ${where} ORDER BY i.createdAt DESC LIMIT ${parseInt(String(limit))} OFFSET ${parseInt(String(offset))}`,
            params
        );

        const [countResult]: any = await conn.execute(
            `SELECT COUNT(*) as total FROM Inventory i ${where}`, params
        );

        await conn.end();
        return NextResponse.json({
            success: true,
            data: {
                items,
                total: countResult[0].total,
                page,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (e: any) {
        await conn.end();
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// POST /api/inventory
export async function POST(req: NextRequest) {
    const conn = await mysql.createConnection(process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet");
    try {
        const body = await req.json();
        const { productId, supplierId, type, quantity, price, note } = body;

        if (!productId || !type || !quantity) {
            await conn.end();
            return NextResponse.json({ success: false, error: "Thiếu thông tin bắt buộc" }, { status: 400 });
        }

        const id = Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
        const now = new Date().toISOString().slice(0, 19).replace("T", " ");
        const qty = Number(quantity);
        const unitPrice = price ? Number(price) : null;

        // Insert inventory record
        await conn.execute(
            `INSERT INTO Inventory (id, productId, supplierId, type, quantity, price, note, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, productId, supplierId || null, type, qty, unitPrice, note || null, now]
        );

        // Update product stock
        const delta = type === "IN" ? qty : type === "OUT" ? -qty : qty;
        await conn.execute(
            `UPDATE Product SET stock = stock + ?, updatedAt = ? WHERE id = ?`,
            [delta, now, productId]
        );

        // Tính giá nhập trung bình nếu là nhập kho và có giá
        if (type === "IN" && unitPrice) {
            // Lấy tồn kho TRƯỚC khi nhập (stock hiện tại đã được cộng thêm qty rồi)
            const [productRow]: any = await conn.execute(
                `SELECT stock, buyPrice FROM Product WHERE id = ?`,
                [productId]
            );

            if (productRow.length > 0) {
                const currentStock = Number(productRow[0].stock); // đã bao gồm qty vừa nhập
                const oldStock = currentStock - qty; // tồn trước khi nhập
                const oldBuyPrice = Number(productRow[0].buyPrice) || unitPrice;

                let avgPrice: number;
                if (oldStock <= 0) {
                    // Không còn tồn cũ → giá nhập mới luôn
                    avgPrice = unitPrice;
                } else {
                    // Weighted average: (tồn cũ × giá cũ + nhập mới × giá mới) / tổng tồn mới
                    avgPrice = Math.round(
                        (oldStock * oldBuyPrice + qty * unitPrice) / (oldStock + qty)
                    );
                }

                await conn.execute(
                    `UPDATE Product SET buyPrice = ?, updatedAt = ? WHERE id = ?`,
                    [avgPrice, now, productId]
                );
            }
        }

        // Lấy record vừa tạo
        const [newRecord]: any = await conn.execute(
            `SELECT i.*, p.name as productName, p.code as productCode, 
              p.buyPrice as currentBuyPrice, s.name as supplierName
       FROM Inventory i
       LEFT JOIN Product p ON i.productId = p.id
       LEFT JOIN Supplier s ON i.supplierId = s.id
       WHERE i.id = ?`,
            [id]
        );

        await conn.end();
        return NextResponse.json({ success: true, data: newRecord[0] }, { status: 201 });
    } catch (e: any) {
        await conn.end();
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}