"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import Image from "next/image";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
const pct = (sale: number, orig: number) => orig > 0 ? Math.round((1 - sale / orig) * 100) : 0;

interface Product {
  id: string; code: string; name: string; description?: string;
  buyPrice: number; sellPrice: number; salePrice?: number;
  stock: number; minStock: number;
  image?: string; categoryId: string; categoryName: string;
}
interface Category { id: string; name: string; productCount: number; }

export default function ProductsPage() {
  const { canDelete } = useAuth();
  const isMobile = useIsMobile();
  const fileRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", buyPrice: "", sellPrice: "", salePrice: "",
    stock: "0", minStock: "5", categoryId: "", image: "",
  });
  const [imagePreview, setImagePreview] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (catFilter) params.set("categoryId", catFilter);
      params.set("limit", "100");
      params.set("_t", Date.now().toString());
      const res = await fetch(`/api/products?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setProducts(data.data.items);
    } finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { fetch("/api/categories").then(r => r.json()).then(d => { if (d.success) setCategories(d.data); }); }, []);
  useEffect(() => { const t = setTimeout(fetchProducts, 300); return () => clearTimeout(t); }, [fetchProducts]);

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", buyPrice: "", sellPrice: "", salePrice: "", stock: "0", minStock: "5", categoryId: categories[0]?.id || "", image: "" });
    setImagePreview("");
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, description: p.description || "",
      buyPrice: String(p.buyPrice), sellPrice: String(p.sellPrice),
      salePrice: p.salePrice ? String(p.salePrice) : "",
      stock: String(p.stock), minStock: String(p.minStock),
      categoryId: p.categoryId, image: p.image || "",
    });
    setImagePreview(p.image || "");
    setShowForm(true);
  };

  // Upload ảnh lên Cloudinary
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview ngay lập tức
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(f => ({ ...f, image: data.url }));
        setImagePreview(data.url);
        setMsg("✅ Upload ảnh thành công!");
      } else {
        // Nếu Cloudinary chưa cấu hình, dùng base64 tạm
        const base64 = await file.text();
        setMsg("⚠️ " + data.error + " — Dùng URL ảnh thay thế.");
      }
    } catch {
      setMsg("❌ Lỗi upload ảnh");
    } finally {
      setUploading(false);
      setTimeout(() => setMsg(""), 4000);
    }
  }

  const handleSave = async () => {
    if (!form.name || !form.buyPrice || !form.sellPrice || !form.categoryId) {
      setMsg("❌ Vui lòng điền đầy đủ thông tin!"); return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description,
        buyPrice: Number(form.buyPrice), sellPrice: Number(form.sellPrice),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        stock: Number(form.stock), minStock: Number(form.minStock),
        categoryId: form.categoryId, image: form.image || null,
      };
      const url = editProduct ? `/api/products/${editProduct.id}` : "/api/products";
      const method = editProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setShowForm(false); setImagePreview("");
        setMsg(editProduct ? "✅ Cập nhật thành công!" : "✅ Thêm sản phẩm thành công!");
        fetchProducts();
      } else { setMsg("❌ " + data.error); }
    } finally { setSaving(false); setTimeout(() => setMsg(""), 3000); }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setMsg("✅ Đã xóa!"); fetchProducts(); }
    else setMsg("❌ " + data.error);
    setTimeout(() => setMsg(""), 3000);
  };

  const lowStock = products.filter(p => p.stock < p.minStock);
  const sellP = Number(form.sellPrice);
  const saleP = Number(form.salePrice);
  const buyP = Number(form.buyPrice);
  const discount = form.salePrice && saleP > 0 ? pct(saleP, sellP) : 0;
  const profit = form.salePrice && saleP > 0 ? saleP - buyP : sellP - buyP;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>📦 Quản lý sản phẩm</h1>
        <button onClick={openAdd} style={{ background: "#F4B400", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>＋ Thêm sản phẩm</button>
      </div>

      {msg && <div style={{ background: msg.startsWith("✅") ? "#E8F5E9" : msg.startsWith("⚠️") ? "#FFF8E1" : "#FFEBEE", color: msg.startsWith("✅") ? "#2E7D32" : msg.startsWith("⚠️") ? "#E65100" : "#B71C1C", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 500 }}>{msg}</div>}

      {lowStock.length > 0 && (
        <div style={{ background: "#FFF8E1", border: "1.5px solid #FFE082", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          ⚠️ <span style={{ fontSize: 13, color: "#E65100", fontWeight: 500 }}>Tồn kho thấp: {lowStock.map(p => `${p.name} (còn ${p.stock})`).join(", ")}</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: "9px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, background: "#fafafa" }}>
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.productCount})</option>)}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Tổng sản phẩm", value: products.length, color: "#F4B400" },
          { label: "Còn hàng", value: products.filter(p => p.stock > p.minStock).length, color: "#4CAF50" },
          { label: "Đang giảm giá", value: products.filter(p => p.salePrice && p.salePrice < p.sellPrice).length, color: "#E91E63" },
          { label: "Hết hàng", value: products.filter(p => p.stock === 0).length, color: "#B71C1C" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
        ) : isMobile ? (
          <div>
            {products.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#aaa" }}>Không có sản phẩm</div>
            ) : products.map(p => (
              <div key={p.id} style={{ padding: "14px 16px", borderBottom: "1px solid #f5f5f5", display: "flex", gap: 12 }}>
                {/* Ảnh */}
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", background: "#f5f5f5", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>📦</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#F4B400", fontWeight: 700 }}>{p.code}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  <span style={{ background: "#FFF8E1", color: "#F57F17", padding: "2px 8px", borderRadius: 20, fontSize: 11 }}>{p.categoryName}</span>
                  <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {p.salePrice && p.salePrice < p.sellPrice ? (
                      <>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#E91E63" }}>{fmt(p.salePrice)}</span>
                        <span style={{ fontSize: 12, color: "#aaa", textDecoration: "line-through" }}>{fmt(p.sellPrice)}</span>
                        <span style={{ background: "#FCE4EC", color: "#E91E63", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 8 }}>-{pct(p.salePrice, p.sellPrice)}%</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#4CAF50" }}>{fmt(p.sellPrice)}</span>
                    )}
                    <span style={{ fontSize: 11, color: "#888" }}>Nhập: {fmt(p.buyPrice)}</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: p.stock === 0 ? "#B71C1C" : p.stock <= p.minStock ? "#E65100" : "#2E7D32", fontWeight: 600 }}>
                    {p.stock === 0 ? "⚠️ Hết hàng" : p.stock <= p.minStock ? `⚠️ Còn ${p.stock}` : `Tồn: ${p.stock}`}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button onClick={() => openEdit(p)} style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✏️ Sửa</button>
                    {canDelete && <button onClick={() => handleDelete(p)} style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>🗑️</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9f9f9" }}>
                {["Ảnh", "Mã SP", "Tên sản phẩm", "Danh mục", "Giá nhập", "Giá gốc", "Giá KM", "Tồn kho", ""].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, color: "#888", fontWeight: 600, borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#aaa" }}>Không có sản phẩm</td></tr>
              ) : products.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f9f9f9" }} className="hover:bg-gray-50">
                  {/* Ảnh */}
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {p.image
                        ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 20 }}>📦</span>}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#F4B400", whiteSpace: "nowrap" }}>{p.code}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, maxWidth: 200 }}>{p.name}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: "#FFF8E1", color: "#F57F17", padding: "3px 10px", borderRadius: 20, fontSize: 12, whiteSpace: "nowrap" }}>{p.categoryName}</span>
                  </td>
                  {/* Giá nhập */}
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "#666", whiteSpace: "nowrap" }}>{fmt(p.buyPrice)}</td>
                  {/* Giá gốc */}
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    {p.salePrice && p.salePrice < p.sellPrice
                      ? <span style={{ fontSize: 12, color: "#aaa", textDecoration: "line-through" }}>{fmt(p.sellPrice)}</span>
                      : <span style={{ fontSize: 13, fontWeight: 700, color: "#4CAF50" }}>{fmt(p.sellPrice)}</span>
                    }
                  </td>
                  {/* Giá KM */}
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    {p.salePrice && p.salePrice < p.sellPrice ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#E91E63" }}>{fmt(p.salePrice)}</span>
                        <span style={{ background: "#FCE4EC", color: "#E91E63", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 6 }}>-{pct(p.salePrice, p.sellPrice)}%</span>
                      </div>
                    ) : <span style={{ color: "#ccc", fontSize: 12 }}>—</span>}
                  </td>
                  {/* Tồn kho */}
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: p.stock === 0 ? "#B71C1C" : p.stock <= p.minStock ? "#E65100" : "#2E7D32" }}>
                      {p.stock === 0 ? "⚠️ Hết" : p.stock <= p.minStock ? `⚠️ ${p.stock}` : p.stock}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(p)} style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>✏️</button>
                      {canDelete && <button onClick={() => handleDelete(p)} style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ padding: "12px 16px", fontSize: 13, color: "#888", borderTop: "1px solid #f0f0f0" }}>Tổng: {products.length} sản phẩm</div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "20px 16px" : "28px 32px", width: isMobile ? "100%" : 560, maxHeight: "94vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editProduct ? "✏️ Sửa sản phẩm" : "➕ Thêm sản phẩm"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* === ẢNH SẢN PHẨM === */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 8 }}>Ảnh sản phẩm</label>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {/* Preview */}
                  <div style={{ width: 90, height: 90, borderRadius: 12, border: "2px dashed #e0e0e0", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", cursor: "pointer" }}
                    onClick={() => fileRef.current?.click()}>
                    {imagePreview
                      ? <img src={imagePreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ textAlign: "center", color: "#aaa" }}><div style={{ fontSize: 28 }}>📷</div><div style={{ fontSize: 11, marginTop: 4 }}>Chọn ảnh</div></div>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      style={{ width: "100%", padding: "9px 14px", border: "1.5px solid #e0e0e0", borderRadius: 10, background: "#f9f9f9", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 8 }}>
                      {uploading ? "⏳ Đang upload..." : "📤 Tải ảnh lên"}
                    </button>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6 }}>— hoặc dán URL ảnh —</div>
                    <input value={form.image} onChange={e => { setForm({ ...form, image: e.target.value }); setImagePreview(e.target.value); }}
                      placeholder="https://..."
                      style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e8e8e8", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
              </div>

              {/* Tên + Danh mục */}
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

              {/* === GIÁ === */}
              <div style={{ background: "#f9f9f9", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 12 }}>💰 Giá bán</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 5 }}>Giá nhập (đ) *</label>
                    <input type="number" value={form.buyPrice} onChange={e => setForm({ ...form, buyPrice: e.target.value })} placeholder="0"
                      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e8e8e8", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#4CAF50", display: "block", marginBottom: 5 }}>Giá gốc (đ) *</label>
                    <input type="number" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} placeholder="0"
                      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #4CAF50", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#E91E63", display: "block", marginBottom: 5 }}>Giá KM (đ)</label>
                    <input type="number" value={form.salePrice} onChange={e => setForm({ ...form, salePrice: e.target.value })} placeholder="Để trống nếu không KM"
                      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E91E63", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff" }} />
                  </div>
                </div>

                {/* Tóm tắt lợi nhuận */}
                {form.buyPrice && form.sellPrice && buyP > 0 && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {form.salePrice && saleP > 0 && saleP < sellP && (
                      <span style={{ background: "#FCE4EC", color: "#E91E63", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        🏷️ Giảm {pct(saleP, sellP)}%
                      </span>
                    )}
                    <span style={{ background: "#E8F5E9", color: "#2E7D32", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      💵 Lãi: {fmt(profit)} ({Math.round(profit / buyP * 100)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Tồn kho */}
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

              {/* Mô tả */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Mô tả</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              {msg && <div style={{ color: msg.startsWith("✅") ? "#2E7D32" : msg.startsWith("⚠️") ? "#E65100" : "#B71C1C", fontSize: 13 }}>{msg}</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleSave} disabled={saving || uploading}
                  style={{ flex: 2, padding: "12px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
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
