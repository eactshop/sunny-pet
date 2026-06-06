import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL || "mysql://root:@localhost:3306/sunny_pet";

async function getConn() {
  return mysql.createConnection(DB_URL);
}

const genId = () =>
  Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
const nowVN = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export interface CreateOrderInput {
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  subtotal: number;
  discount: number;
  total: number;
  note?: string;
  promotionId?: string;
  paymentMethod: "CASH" | "BANK_TRANSFER";
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  passwordHash?: string;
}

export async function getProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sort?: string;
}) {
  const conn = await getConn();
  try {
    const page = params.page || 1;
    const limit = params.limit || 24;
    const offset = (page - 1) * limit;
    let where = "WHERE p.active = 1";
    const args: any[] = [];

    if (params.search) {
      where += " AND (p.name LIKE ? OR p.code LIKE ?)";
      args.push(`%${params.search}%`, `%${params.search}%`);
    }
    if (params.categoryId) {
      where += " AND p.categoryId = ?";
      args.push(params.categoryId);
    }

    const orderBy =
      params.sort === "price_asc" ? "COALESCE(p.salePrice, p.sellPrice) ASC" :
      params.sort === "price_desc" ? "COALESCE(p.salePrice, p.sellPrice) DESC" :
      "p.createdAt DESC";

    const [items]: any = await conn.execute(
      `SELECT p.id, p.code, p.name, p.description, p.sellPrice, p.salePrice, p.stock, p.image,
              p.categoryId, p.active, c.name as categoryName
       FROM Product p LEFT JOIN Category c ON p.categoryId = c.id
       ${where} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
      args
    );

    const [countRows]: any = await conn.execute(
      `SELECT COUNT(*) as total FROM Product p ${where}`,
      args
    );

    return {
      items,
      total: countRows[0].total,
      page,
      totalPages: Math.ceil(countRows[0].total / limit),
    };
  } finally {
    await conn.end();
  }
}

export async function getProductById(id: string) {
  const conn = await getConn();
  try {
    const [rows]: any = await conn.execute(
      `SELECT p.id, p.code, p.name, p.description, p.sellPrice, p.salePrice, p.buyPrice,
              p.stock, p.minStock, p.image, p.categoryId, p.active, c.name as categoryName
       FROM Product p LEFT JOIN Category c ON p.categoryId = c.id
       WHERE p.id = ? AND p.active = 1`,
      [id]
    );
    return rows[0] || null;
  } finally {
    await conn.end();
  }
}

export async function getCategories() {
  const conn = await getConn();
  try {
    const [rows]: any = await conn.execute(
      `SELECT c.id, c.name, c.slug, COUNT(p.id) as productCount
       FROM Category c LEFT JOIN Product p ON p.categoryId = c.id AND p.active = 1
       GROUP BY c.id ORDER BY c.name`
    );
    return rows;
  } finally {
    await conn.end();
  }
}

export async function createCustomer(input: CreateCustomerInput) {
  const conn = await getConn();
  try {
    const id = genId();
    const now = nowVN();
    await conn.execute(
      `INSERT INTO Customer (id, name, phone, email, address, totalOrders, totalSpent, passwordHash, source, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, 'STORE', ?, ?)`,
      [id, input.name, input.phone, input.email || null, input.address || null, input.passwordHash || null, now, now]
    );
    const [rows]: any = await conn.execute("SELECT * FROM Customer WHERE id = ?", [id]);
    return rows[0];
  } finally {
    await conn.end();
  }
}

export async function getCustomerByPhone(phone: string) {
  const conn = await getConn();
  try {
    const [rows]: any = await conn.execute(
      "SELECT * FROM Customer WHERE phone = ? LIMIT 1",
      [phone]
    );
    return rows[0] || null;
  } finally {
    await conn.end();
  }
}

export async function getCustomerById(id: string) {
  const conn = await getConn();
  try {
    const [rows]: any = await conn.execute(
      "SELECT id, name, phone, email, address, totalOrders, totalSpent FROM Customer WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  } finally {
    await conn.end();
  }
}

export async function updateCustomerPassword(customerId: string, passwordHash: string) {
  const conn = await getConn();
  try {
    await conn.execute(
      "UPDATE Customer SET passwordHash = ?, updatedAt = ? WHERE id = ?",
      [passwordHash, nowVN(), customerId]
    );
  } finally {
    await conn.end();
  }
}

export async function createOrder(input: CreateOrderInput) {
  const conn = await getConn();
  try {
    // Validate stock
    for (const item of input.items) {
      const [pRows]: any = await conn.execute(
        "SELECT name, stock FROM Product WHERE id = ?",
        [item.productId]
      );
      if (!pRows.length) throw new Error("Sản phẩm không tồn tại");
      if (pRows[0].stock < item.quantity) {
        throw new Error(`"${pRows[0].name}" không đủ tồn kho (còn ${pRows[0].stock})`);
      }
    }

    const [userRows]: any = await conn.execute("SELECT id FROM User LIMIT 1");
    const userId = userRows[0]?.id || "";

    const id = genId();
    const code = `WEB${Date.now().toString().slice(-8)}`;
    const now = nowVN();

    await conn.execute(
      `INSERT INTO \`Order\` (id, code, customerId, userId, status, subtotal, discount, total,
        note, paymentMethod, promotionId, deliveryName, deliveryPhone, deliveryAddress,
        orderSource, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'STORE', ?, ?)`,
      [
        id, code, input.customerId, userId,
        input.subtotal, input.discount, input.total,
        input.note || null, input.paymentMethod,
        input.promotionId || null,
        input.deliveryName, input.deliveryPhone, input.deliveryAddress,
        now, now,
      ]
    );

    for (const item of input.items) {
      const itemId = genId();
      await conn.execute(
        `INSERT INTO OrderItem (id, orderId, productId, quantity, price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, id, item.productId, item.quantity, item.price, item.price * item.quantity]
      );
      // Deduct stock
      await conn.execute(
        "UPDATE Product SET stock = stock - ?, updatedAt = ? WHERE id = ?",
        [item.quantity, now, item.productId]
      );
    }

    // Update customer stats
    await conn.execute(
      `UPDATE Customer SET totalOrders = totalOrders + 1, totalSpent = totalSpent + ?,
       lastOrderAt = ?, updatedAt = ? WHERE id = ?`,
      [input.total, now, now, input.customerId]
    );

    const [newOrder]: any = await conn.execute(
      `SELECT o.*, c.name as customerName FROM \`Order\` o
       LEFT JOIN Customer c ON o.customerId = c.id WHERE o.id = ?`,
      [id]
    );

    return newOrder[0];
  } finally {
    await conn.end();
  }
}

export async function getOrdersByCustomer(customerId: string) {
  const conn = await getConn();
  try {
    const [orders]: any = await conn.execute(
      `SELECT * FROM \`Order\` WHERE customerId = ? ORDER BY createdAt DESC`,
      [customerId]
    );
    for (const order of orders) {
      const [items]: any = await conn.execute(
        `SELECT oi.*, p.name as productName, p.code as productCode, p.image as productImage
         FROM OrderItem oi LEFT JOIN Product p ON oi.productId = p.id
         WHERE oi.orderId = ?`,
        [order.id]
      );
      order.items = items;
    }
    return orders;
  } finally {
    await conn.end();
  }
}

export async function getOrderById(orderId: string) {
  const conn = await getConn();
  try {
    const [rows]: any = await conn.execute(
      `SELECT o.*, c.name as customerName FROM \`Order\` o
       LEFT JOIN Customer c ON o.customerId = c.id WHERE o.id = ?`,
      [orderId]
    );
    if (!rows.length) return null;
    const order = rows[0];
    const [items]: any = await conn.execute(
      `SELECT oi.*, p.name as productName, p.code as productCode, p.image as productImage
       FROM OrderItem oi LEFT JOIN Product p ON oi.productId = p.id
       WHERE oi.orderId = ?`,
      [orderId]
    );
    order.items = items;
    return order;
  } finally {
    await conn.end();
  }
}

export async function validateVoucher(code: string, orderTotal: number) {
  const conn = await getConn();
  try {
    const now = nowVN();
    const [rows]: any = await conn.execute(
      `SELECT p.*,
        (SELECT COUNT(*) FROM \`Order\` o WHERE o.promotionId = p.id) as usedCount
       FROM Promotion p WHERE p.code = ? AND p.active = 1
       AND p.startDate <= ? AND p.endDate >= ?`,
      [code, now, now]
    );
    if (!rows.length) return null;
    const promo = rows[0];
    if (promo.minOrder && orderTotal < promo.minOrder) return null;
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return null;
    return promo;
  } finally {
    await conn.end();
  }
}

export async function syncInventory(productId: string) {
  const conn = await getConn();
  try {
    const [rows]: any = await conn.execute(
      "SELECT stock FROM Product WHERE id = ? AND active = 1",
      [productId]
    );
    return rows[0]?.stock ?? 0;
  } finally {
    await conn.end();
  }
}
