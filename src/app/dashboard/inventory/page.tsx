"use client";
import { useState, useEffect, useCallback } from "react";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

interface Product {
  id: string; code: string; name: string;
  stock: number; minStock: number; buyPrice: number; categoryName: string;
}
interface Supplier { id: string; name: string; phone?: string; }
interface InventoryRecord {
  id: string; type: string; quantity: number; price?: number;
  note?: string; createdAt: string;
  productName: string; productCode: string; supplierName?: string;
}

const typeLabel: Record<string, { label: string; color: string; bg: string }> = {
  IN:     { label: "Nhập kho",   color: "#2E7D32", bg: "#E8F5E9" },
  OUT:    { label: "Xuất kho",   color: "#B71C1C", bg: "#FFEBEE" },
  ADJUST: { label: "Điều chỉnh", color: "#1565C0", bg: "#E3F2FD" },
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"products" | "history">("products");
  const [showForm, setShowForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [form, setForm] = useState({
    productId: "", supplierId: "", type: "IN",
    quantity: "", price: "", note: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "", phone: "", email: "", address: "",
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?limit=100");
      const data = await res.json();
      if (data.success) setProducts(data.data.items);
    } finally { setLoading(false); }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    if (data.success) setSuppliers(data.data);
  }, []);

  const fetchRecords = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    const res = await fetch(`/api/inventory?${params}&limit=50`);
    const data = await res.json();
    if (data.success) setRecords(data.data.items);
  }, [typeFilter]);

  useEffect(() => { fetchProducts(); fetchSuppliers(); }, [fetchProducts, fetchSuppliers]);
  useEffect(() => { if (tab === "history") fetchRecords(); }, [tab, fetchRecords]);

  const handleImport = async () => {
    if (!form.productId || !form.quantity) {
      setMsg("❌ Vui lòng chọn sản phẩm và nhập số lượng!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.productId,
          supplierId: form.supplierId || null,
          type: form.type,
          quantity: Number(form.quantity),
          price: form.price ? Number(form.price) : null,
          note: form.note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("✅ Cập nhật kho thành công!");
        setShowForm(false);
        setForm({ productId: "", supplierId: "", type: "IN", quantity: "", price: "", note: "" });
        fetchProducts();
        if (tab === "history") fetchRecords();
      } else {
        setMsg("❌ Lỗi: " + data.error);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleAddSupplier = async () => {
    if (!supplierForm.name) { setMsg("❌ Vui lòng nhập tên nhà cung cấp!"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("✅ Thêm nhà cung cấp thành công!");
        setShowSupplierForm(false);
        setSupplierForm({ name: "", phone: "", email: "", address: "" });
        fetchSuppliers();
      } else {
        setMsg("❌ Lỗi: " + data.error);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const lowStock = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.buyPrice, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>🏪 Quản lý kho hàng</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowSupplierForm(true)}
            style={{ background: "#fff", color: "#555", border: "1.5px solid #e8e8e8", padding: "9px 16px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            🏭 Nhà cung cấp
          </button>
          <button onClick={() => { setForm({ productId: "", supplierId: "", type: "IN", quantity: "", price: "", note: "" }); setShowForm(true); }}
            style={{ background: "#4CAF50", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            📥 Nhập / Xuất kho
          </button>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ background: msg.startsWith("✅") ? "#E8F5E9" : "#FFEBEE", color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 500 }}>
          {msg}
        </div>
      )}

      {/* Warning */}
      {lowStock.length > 0 && (
        <div style={{ background: "#FFF8E1", border: "1.5px solid #FFE082", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: "#E65100", fontSize: 14 }}>Cảnh báo tồn kho thấp ({lowStock.length} sản phẩm)</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              {lowStock.map(p => `${p.name} (còn ${p.stock})`).join(" • ")}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "📦", label: "Tổng SKU", value: products.length + " SP", color: "#F4B400" },
          { icon: "✅", label: "Còn hàng", value: products.filter(p => p.stock > p.minStock).length, color: "#4CAF50" },
          { icon: "⚠️", label: "Tồn thấp / Hết", value: lowStock.length, color: "#FF7043" },
          { icon: "💰", label: "Giá trị kho", value: fmt(totalValue), color: "#42A5F5" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderLeft: `4px solid ${s.color}`, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f5f5f5", borderRadius: 12, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {[{ key: "products", label: "📦 Tồn kho hiện tại" }, { key: "history", label: "📋 Lịch sử nhập/xuất" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: "8px 20px", borderRadius: 9, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#F4B400" : "#888", boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Products stock table */}
      {tab === "products" && (
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9" }}>
                  {["Mã SP", "Tên sản phẩm", "Danh mục", "Giá nhập", "Tồn kho", "Tồn tối thiểu", "Giá trị", "Trạng thái", ""].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, color: "#888", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const status = p.stock === 0 ? { label: "Hết hàng", color: "#B71C1C", bg: "#FFEBEE" }
                    : p.stock <= p.minStock ? { label: "Sắp hết", color: "#E65100", bg: "#FFF8E1" }
                    : { label: "Còn hàng", color: "#2E7D32", bg: "#E8F5E9" };
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#F4B400" }}>{p.code}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12 }}>
                        <span style={{ background: "#FFF8E1", color: "#F57F17", padding: "2px 8px", borderRadius: 20, fontSize: 11 }}>{p.categoryName}</span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#666" }}>{fmt(p.buyPrice)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 800, color: status.color }}>{p.stock}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#888" }}>{p.minStock}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600 }}>{fmt(p.stock * p.buyPrice)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: status.bg, color: status.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{status.label}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button onClick={() => { setForm({ productId: p.id, supplierId: "", type: "IN", quantity: "", price: String(p.buyPrice), note: "" }); setShowForm(true); }}
                          style={{ background: "#E8F5E9", color: "#2E7D32", border: "none", padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                          + Nhập
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: "9px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, background: "#fafafa" }}>
              <option value="">Tất cả loại</option>
              <option value="IN">Nhập kho</option>
              <option value="OUT">Xuất kho</option>
              <option value="ADJUST">Điều chỉnh</option>
            </select>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9f9f9" }}>
                  {["Loại", "Sản phẩm", "Số lượng", "Đơn giá", "Nhà cung cấp", "Ghi chú", "Thời gian"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, color: "#888", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#aaa" }}>Chưa có lịch sử</td></tr>
                ) : records.map(r => {
                  const t = typeLabel[r.type] || { label: r.type, color: "#666", bg: "#f5f5f5" };
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: t.bg, color: t.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{t.label}</span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: "#F4B400" }}>{r.productCode}</span> {r.productName}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 800, color: r.type === "IN" ? "#2E7D32" : "#B71C1C" }}>
                        {r.type === "IN" ? "+" : "-"}{r.quantity}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13 }}>{r.price ? fmt(r.price) : "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#666" }}>{r.supplierName || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#888" }}>{r.note || "—"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#888" }}>
                        {new Date(r.createdAt).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📦 Nhập / Xuất kho</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Type */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Loại *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ v: "IN", l: "📥 Nhập kho", c: "#4CAF50" }, { v: "OUT", l: "📤 Xuất kho", c: "#FF7043" }, { v: "ADJUST", l: "🔧 Điều chỉnh", c: "#42A5F5" }].map(t => (
                    <button key={t.v} onClick={() => setForm({ ...form, type: t.v })}
                      style={{ flex: 1, padding: "10px", border: `2px solid ${form.type === t.v ? t.c : "#e8e8e8"}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13, background: form.type === t.v ? t.c + "22" : "#fff", color: form.type === t.v ? t.c : "#666" }}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Sản phẩm *</label>
                <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name} (Tồn: {p.stock})</option>)}
                </select>
              </div>

              {/* Quantity & Price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Số lượng *</label>
                  <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0"
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Đơn giá (đ)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0"
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              {/* Supplier (only for IN) */}
              {form.type === "IN" && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Nhà cung cấp</label>
                  <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                    <option value="">-- Không chọn --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}{s.phone ? ` (${s.phone})` : ""}</option>)}
                  </select>
                </div>
              )}

              {/* Note */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Ghi chú</label>
                <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Nhập ghi chú..."
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleImport} disabled={saving}
                  style={{ flex: 1, padding: "12px", background: saving ? "#ccc" : "#4CAF50", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳ Đang lưu..." : "💾 Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🏭 Thêm nhà cung cấp</h2>
              <button onClick={() => setShowSupplierForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Tên nhà cung cấp *", key: "name", placeholder: "VD: Công ty TNHH Thú Y ABC" },
                { label: "Số điện thoại", key: "phone", placeholder: "0901234567" },
                { label: "Email", key: "email", placeholder: "contact@abc.vn" },
                { label: "Địa chỉ", key: "address", placeholder: "123 Đường ABC, Q1" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input value={(supplierForm as any)[f.key]} onChange={e => setSupplierForm({ ...supplierForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}

              {/* Existing suppliers */}
              {suppliers.length > 0 && (
                <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 8 }}>Nhà cung cấp hiện có:</div>
                  {suppliers.map(s => (
                    <div key={s.id} style={{ fontSize: 13, color: "#444", padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                      🏭 {s.name} {s.phone && <span style={{ color: "#888" }}>— {s.phone}</span>}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowSupplierForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleAddSupplier} disabled={saving}
                  style={{ flex: 1, padding: "12px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳..." : "💾 Lưu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}