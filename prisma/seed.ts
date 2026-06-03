import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const DB_URL = "mysql://root:@localhost:3306/sunny_pet";

async function main() {
  const conn = await mysql.createConnection(DB_URL);
  console.log("🌱 Kết nối database thành công!");

  // Helper
  const q = (sql: string, params: any[] = []) => conn.execute(sql, params);
  const id = () => Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 18);
  const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

  // 1. Categories
  const cats = [
    "Thức ăn chó", "Thức ăn mèo", "Sữa tắm", "Xịt ve rận",
    "Thuốc thú y", "Cát vệ sinh", "Đồ chơi", "Phụ kiện", "Khác",
  ];
  const catIds: Record<string, string> = {};
  for (const name of cats) {
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
    const cid = id();
    catIds[name] = cid;
    await q(`INSERT IGNORE INTO Category (id, name, slug) VALUES (?, ?, ?)`, [cid, name, slug]);
  }
  console.log("✅ Danh mục");

  // 2. Users
  const hashed = await bcrypt.hash("admin123", 12);
  const staffHash = await bcrypt.hash("staff123", 12);
  const adminId = id();
  const staffId = id();
  await q(`INSERT IGNORE INTO User (id, email, password, name, role, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [adminId, "admin@sunnypet.vn", hashed, "Admin Sunny", "OWNER", now(), now()]);
  await q(`INSERT IGNORE INTO User (id, email, password, name, role, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [staffId, "staff@sunnypet.vn", staffHash, "Nhân viên A", "STAFF", now(), now()]);
  console.log("✅ Tài khoản");

  // 3. Supplier
  const supId = id();
  await q(`INSERT IGNORE INTO Supplier (id, name, phone, email, address, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [supId, "NCC Thú Y Minh Châu", "0901111222", "minchau@ncc.vn", "45 Nguyễn Trãi, Q5", now()]);
  console.log("✅ Nhà cung cấp");

  // 4. Products
  const products = [
    { name: "Royal Canin Adult", buy: 280000, sell: 350000, stock: 45, cat: "Thức ăn chó", code: "SP001" },
    { name: "Whiskas Tuna", buy: 18000, sell: 25000, stock: 120, cat: "Thức ăn mèo", code: "SP002" },
    { name: "Bio-Groom Shampoo", buy: 95000, sell: 135000, stock: 3, cat: "Sữa tắm", code: "SP003" },
    { name: "Frontline Spray 250ml", buy: 185000, sell: 240000, stock: 28, cat: "Xịt ve rận", code: "SP004" },
    { name: "Biokat's Classic 5kg", buy: 55000, sell: 75000, stock: 0, cat: "Cát vệ sinh", code: "SP005" },
    { name: "Cần câu lông vũ", buy: 25000, sell: 45000, stock: 67, cat: "Đồ chơi", code: "SP006" },
    { name: "Vòng cổ da size M", buy: 45000, sell: 80000, stock: 22, cat: "Phụ kiện", code: "SP007" },
    { name: "Thuốc nhỏ mắt Genteal", buy: 35000, sell: 55000, stock: 2, cat: "Thuốc thú y", code: "SP008" },
    { name: "Pedigree Adult", buy: 95000, sell: 130000, stock: 60, cat: "Thức ăn chó", code: "SP009" },
    { name: "Royal Canin Kitten", buy: 250000, sell: 320000, stock: 30, cat: "Thức ăn mèo", code: "SP010" },
  ];
  for (const p of products) {
    const pid = id();
    await q(`INSERT IGNORE INTO Product (id, code, name, buyPrice, sellPrice, stock, minStock, active, categoryId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 5, 1, ?, ?, ?)`,
      [pid, p.code, p.name, p.buy, p.sell, p.stock, catIds[p.cat], now(), now()]);
  }
  console.log("✅ Sản phẩm");

  // 5. Services
  const services = [
    { name: "Tắm", price: 80000, dur: 60 },
    { name: "Cắt tỉa lông", price: 150000, dur: 90 },
    { name: "Vệ sinh tai", price: 50000, dur: 30 },
    { name: "Cắt móng", price: 40000, dur: 20 },
    { name: "Combo chăm sóc", price: 280000, dur: 150 },
  ];
  for (const s of services) {
    await q(`INSERT IGNORE INTO Service (id, name, price, duration, active) VALUES (?, ?, ?, ?, 1)`,
      [id(), s.name, s.price, s.dur]);
  }
  console.log("✅ Dịch vụ spa");

  // 6. Customers + Pets
  const c1id = id();
  await q(`INSERT IGNORE INTO Customer (id, name, phone, email, address, totalOrders, totalSpent, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 5, 1250000, ?, ?)`,
    [c1id, "Nguyễn Thị Hoa", "0901234567", "hoa@email.com", "12 Nguyễn Trãi, Q1", now(), now()]);
  await q(`INSERT INTO Pet (id, name, species, breed, gender, weight, customerId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id(), "Miu", "Chó", "Poodle", "Cái", 4.5, c1id, now()]);
  await q(`INSERT INTO Pet (id, name, species, breed, gender, weight, customerId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id(), "Bông", "Mèo", "Mèo ta", "Đực", 3.2, c1id, now()]);

  const c2id = id();
  await q(`INSERT IGNORE INTO Customer (id, name, phone, address, totalOrders, totalSpent, createdAt, updatedAt) VALUES (?, ?, ?, ?, 3, 780000, ?, ?)`,
    [c2id, "Trần Văn Nam", "0912345678", "45 Lê Lợi, Q3", now(), now()]);
  await q(`INSERT INTO Pet (id, name, species, breed, gender, weight, customerId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id(), "Lucky", "Chó", "Golden Retriever", "Đực", 28, c2id, now()]);

  const c3id = id();
  await q(`INSERT IGNORE INTO Customer (id, name, phone, email, address, totalOrders, totalSpent, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 12, 4500000, ?, ?)`,
    [c3id, "Lê Thị Mai", "0923456789", "mai@email.com", "78 Hai Bà Trưng, Q1", now(), now()]);
  await q(`INSERT INTO Pet (id, name, species, breed, gender, weight, customerId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id(), "Coco", "Chó", "Shih Tzu", "Cái", 5.1, c3id, now()]);
  console.log("✅ Khách hàng và thú cưng");

  // 7. Promotions
  await q(`INSERT IGNORE INTO Promotion (id, code, name, type, value, minOrder, startDate, endDate, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [id(), "SUMMER20", "Khuyến mãi hè 2025", "PERCENT", 20, 500000, "2025-06-01", "2025-12-31", now()]);
  await q(`INSERT IGNORE INTO Promotion (id, code, name, type, value, minOrder, startDate, endDate, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [id(), "NEWPET50K", "Chào thú cưng mới", "FIXED", 50000, 200000, "2025-06-01", "2025-12-31", now()]);
  console.log("✅ Khuyến mãi");

  await conn.end();

  console.log("\n🎉 Seed hoàn tất!");
  console.log("📧 Admin: admin@sunnypet.vn / admin123");
  console.log("👤 Staff: staff@sunnypet.vn / staff123");
}

main().catch(console.error);