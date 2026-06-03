"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

interface Product {
  id: string; code: string; name: string; description?: string;
  buyPrice: number; sellPrice: number; stock: number; minStock: number;
  image?: string; categoryId: string; categoryName: string;
}
interface Category { id: string; name: string; productCount: number; }

const EMOJI_MAP: Record<string, string> = {
  "Thức ăn chó": "🐕", "Thức ăn mèo": "🐈", "Sữa tắm": "🛁",
  "Xịt ve rận": "💊", "Thuốc thú y": "💉", "Cát vệ sinh": "🪣",
  "Đồ chơi": "🎣", "Phụ kiện": "📿", "Khác": "📦",
};

export default function ProductsPage() {
  const { canDelete } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", buyPrice: "", sellPrice: "",
    stock: "0", minStock: "5", categoryId: "",
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (catFilter) params.set("categoryId", catFilter);
      params.set("_t", Date.now().toString());
      const res = await fetch(`/api/products?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setProducts(data.data.items);
    } finally { setLoading(false); }
  }, [search, catFilter]);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { const t = setTimeout(fetchProducts, 300); return () => clearTimeout(t); }, [fetchProducts]);

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", buyPrice: "", sellPrice: "", stock: "0", minStock: "5", categoryId: categories[0]?.id || "" });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description || "", buyPrice: String(p.buyPrice), sellPrice: String(p.sellPrice), stock: String(p.stock), minStock: String(p.minStock), categoryId: p.categoryId });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.buyPrice || !form.sellPrice || !form.categoryId) {
      setMsg("❌ Vui lòng điền đầy đủ thông tin!"); return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, buyPrice: Number(form.buyPrice), sellPrice: Number(form.sellPrice), stock: Number(form.stock), minStock: Number(form.minStock), categoryId: form.categoryId };
      const url = editProduct ? `/api/products/${editProduct.id}` : "/api/products";
      const method = editProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setMsg(editProduct ? "✅ Cập nhật thành công!" : "✅ Thêm sản phẩm thành công!");
        const res2 = await fetch(`/api/products?_t=${Date.now()}`, { cache: "no-store" });
        const data2 = await res2.json();
        if (data2.success) setProducts(data2.data.items);
      } else { setMsg("❌ " + data.error); }
    } finally { setSaving(false); setTimeout(() => setMsg(""), 3000); }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setMsg("✅ Đã xóa sản phẩm!"); fetchProducts(); }
    else setMsg("❌ " + data.error);
    setTimeout(() => setMsg(""), 3000);
  };

  const lowStock = products.filter(p => p.stock < p.minStock);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>📦 Quản lý sản phẩm</h1>
        <button onClick={openAdd} style={{ background: "#F4B400", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>＋ Thêm sản phẩm</button>
      </div>

      {msg && <div style={{ background: msg.startsWith("✅") ? "#E8F5E9" : "#FFEBEE", color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 500 }}>{msg}</div>}

      {lowStock.length > 0 && (
        <div style={{ background: "#FFF8E1", border: "1.5px solid #FFE082", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span>⚠️</span>
          <span style={{ fontSize: 13, color: "#E65100", fontWeight: 500 }}>Tồn kho thấp: {lowStock.map(p => `${p.name} (còn ${p.stock})`).join(", ")}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: "9px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, background: "#fafafa", cursor: "pointer" }}>
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.productCount})</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Tổng sản phẩm", value: products.length, color: "#F4B400" },
          { label: "Còn hàng", value: products.filter(p => p.stock > p.minStock).length, color: "#4CAF50" },
          { label: "Sắp hết", value: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length, color: "#FF7043" },
          { label: "Hết hàng", value: products.filter(p => p.stock === 0).length, color: "#B71C1C" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9f9f9" }}>
                {["", "Mã SP", "Tên sản phẩm", "Danh mục", "Giá nhập", "Giá bán", "Tồn kho", "Thao tác"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, color: "#888", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#aaa" }}>Không có sản phẩm</td></tr>
              ) : products.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                  <td style={{ padding: "12px 14px", fontSize: 22 }}>{EMOJI_MAP[p.categoryName] || "📦"}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#F4B400" }}>{p.code}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: "#FFF8E1", color: "#F57F17", padding: "3px 10px", borderRadius: 20, fontSize: 12 }}>{p.categoryName}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#666" }}>{fmt(p.buyPrice)}</td>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#4CAF50" }}>{fmt(p.sellPrice)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: p.stock === 0 ? "#B71C1C" : p.stock <= p.minStock ? "#E65100" : "#2E7D32" }}>
                      {p.stock === 0 ? "⚠️ Hết" : p.stock <= p.minStock ? `⚠️ ${p.stock}` : p.stock}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(p)} style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>✏️ Sửa</button>
                      {canDelete && (
                        <button onClick={() => handleDelete(p)} style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>🗑️ Xóa</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ padding: "12px 16px", fontSize: 13, color: "#888", borderTop: "1px solid #f0f0f0" }}>Tổng: {products.length} sản phẩm</div>
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editProduct ? "✏️ Sửa sản phẩm" : "➕ Thêm sản phẩm mới"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Tên sản phẩm *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Danh mục *</label>
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Giá nhập (đ) *</label>
                  <input type="number" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Giá bán (đ) *</label>
                  <input type="number" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Tồn kho</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Tồn tối thiểu</label>
                  <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Mô tả</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              {form.buyPrice && form.sellPrice && Number(form.buyPrice) > 0 && (
                <div style={{ background: "#E8F5E9", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
                  💰 Lợi nhuận: {fmt(Number(form.sellPrice) - Number(form.buyPrice))} ({Math.round((Number(form.sellPrice) - Number(form.buyPrice)) / Number(form.buyPrice) * 100)}%)
                </div>
              )}
              {msg && <div style={{ color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", fontSize: 13 }}>{msg}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: "12px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳ Đang lưu..." : "💾 Lưu sản phẩm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}