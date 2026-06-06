"use client";
import { useState, useEffect, useCallback } from "react";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

interface Promo {
  id: string; code: string; name: string;
  type: "PERCENT" | "FIXED" | "COMBO";
  value: number; minOrder?: number; maxDiscount?: number; maxUses?: number;
  startDate: string; endDate: string;
  active: boolean; usedCount: number; createdAt: string;
}

const initForm = {
  name: "", code: "", type: "PERCENT" as Promo["type"],
  value: "", minOrder: "", maxDiscount: "", maxUses: "",
  startDate: "", endDate: "", active: true,
};

function isExpired(endDate: string) {
  return new Date(endDate) < new Date();
}

function getStatus(p: Promo) {
  if (!p.active) return { label: "Đã tắt", color: "#888", bg: "#f5f5f5" };
  if (isExpired(p.endDate)) return { label: "Hết hạn", color: "#888", bg: "#f5f5f5" };
  const now = new Date();
  if (new Date(p.startDate) > now) return { label: "Sắp diễn ra", color: "#1565C0", bg: "#E3F2FD" };
  return { label: "Đang hoạt động", color: "#2E7D32", bg: "#E8F5E9" };
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editPromo, setEditPromo] = useState<Promo | null>(null);
  const [form, setForm] = useState(initForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/promotions?${params}`);
      const data = await res.json();
      if (data.success) setPromos(data.data);
    } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { const t = setTimeout(fetchPromos, 300); return () => clearTimeout(t); }, [fetchPromos]);

  function openAdd() {
    setEditPromo(null);
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setForm({ ...initForm, startDate: today, endDate: nextMonth });
    setShowForm(true);
  }

  function openEdit(p: Promo) {
    setEditPromo(p);
    setForm({
      name: p.name, code: p.code, type: p.type,
      value: String(p.value), minOrder: String(p.minOrder || ""),
      maxDiscount: String(p.maxDiscount || ""), maxUses: String(p.maxUses || ""),
      startDate: p.startDate?.slice(0, 10) || "",
      endDate: p.endDate?.slice(0, 10) || "",
      active: p.active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.code || !form.value || !form.startDate || !form.endDate) {
      setMsg("❌ Vui lòng điền đầy đủ thông tin bắt buộc!"); return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setMsg("❌ Ngày kết thúc phải sau ngày bắt đầu!"); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form, value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
      };
      const url = editPromo ? `/api/promotions/${editPromo.id}` : "/api/promotions";
      const method = editPromo ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setMsg(editPromo ? "✅ Cập nhật thành công!" : "✅ Tạo voucher thành công!");
        fetchPromos();
      } else { setMsg("❌ " + data.error); }
    } finally { setSaving(false); setTimeout(() => setMsg(""), 3000); }
  }

  async function toggleActive(p: Promo) {
    const res = await fetch(`/api/promotions/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, active: !p.active, startDate: p.startDate?.slice(0, 10), endDate: p.endDate?.slice(0, 10) }),
    });
    const data = await res.json();
    if (data.success) fetchPromos();
    else setMsg("❌ " + data.error);
  }

  async function handleDelete(p: Promo) {
    if (!confirm(`Xóa voucher "${p.code}"?\nHành động này không thể hoàn tác.`)) return;
    const res = await fetch(`/api/promotions/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setMsg("✅ Đã xóa!"); fetchPromos(); }
    else setMsg("❌ " + data.error);
    setTimeout(() => setMsg(""), 4000);
  }

  // Tính preview giảm giá
  const previewAmount = 1000000;
  const previewDiscount = () => {
    if (!form.value) return 0;
    let d = 0;
    if (form.type === "PERCENT") { d = previewAmount * Number(form.value) / 100; if (form.maxDiscount) d = Math.min(d, Number(form.maxDiscount)); }
    else d = Number(form.value);
    return Math.min(d, previewAmount);
  };

  const activeCount = promos.filter(p => p.active && !isExpired(p.endDate)).length;
  const totalUsed = promos.reduce((s, p) => s + (p.usedCount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>🏷️ Quản lý Voucher</h1>
        <button onClick={openAdd} style={{ background: "#F4B400", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          ＋ Tạo voucher mới
        </button>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith("✅") ? "#E8F5E9" : "#FFEBEE", color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 500 }}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { icon: "✅", label: "Đang hoạt động", value: activeCount, color: "#4CAF50" },
          { icon: "⏰", label: "Hết hạn / Tắt", value: promos.length - activeCount, color: "#888" },
          { icon: "🎫", label: "Tổng lượt dùng", value: totalUsed, color: "#F4B400" },
          { icon: "📋", label: "Tổng voucher", value: promos.length, color: "#42A5F5" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `3px solid ${s.color}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã voucher..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "9px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, background: "#fafafa" }}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="expired">Hết hạn</option>
        </select>
      </div>

      {/* Promo list */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
      ) : promos.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: "60px 20px", textAlign: "center", color: "#aaa", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#666" }}>Chưa có voucher nào</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Bấm "Tạo voucher mới" để bắt đầu</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {promos.map(p => {
            const status = getStatus(p);
            const isActive = p.active && !isExpired(p.endDate);
            const usagePercent = p.maxUses ? Math.min(100, Math.round((p.usedCount / p.maxUses) * 100)) : null;
            return (
              <div key={p.id} style={{ background: "#fff", borderRadius: 16, padding: "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", borderLeft: `4px solid ${isActive ? "#F4B400" : "#e0e0e0"}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  {/* Code badge */}
                  <div style={{ background: isActive ? "#FFF8E1" : "#f5f5f5", border: `2px dashed ${isActive ? "#F4B400" : "#ddd"}`, borderRadius: 12, padding: "10px 18px", textAlign: "center", flexShrink: 0, minWidth: 130 }}>
                    <div style={{ fontWeight: 900, fontSize: 15, color: isActive ? "#F4B400" : "#aaa", letterSpacing: 2 }}>{p.code}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                      {p.type === "PERCENT" ? `Giảm ${p.value}%` : `Giảm ${fmt(p.value)}`}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                      {p.minOrder && p.minOrder > 0 && <span>🛒 Đơn tối thiểu: {fmt(p.minOrder)}</span>}
                      {p.maxDiscount && p.maxDiscount > 0 && <span>🔒 Giảm tối đa: {fmt(p.maxDiscount)}</span>}
                      <span>📅 {new Date(p.startDate).toLocaleDateString("vi-VN")} — {new Date(p.endDate).toLocaleDateString("vi-VN")}</span>
                    </div>
                    {/* Usage bar */}
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#888" }}>🎫 {p.usedCount || 0} lượt {p.maxUses ? `/ ${p.maxUses}` : ""}</span>
                      {usagePercent !== null && (
                        <div style={{ flex: 1, maxWidth: 120, height: 5, borderRadius: 4, background: "#f0f0f0", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: usagePercent >= 90 ? "#E53935" : "#F4B400", width: `${usagePercent}%`, borderRadius: 4 }} />
                        </div>
                      )}
                      {usagePercent !== null && (
                        <span style={{ fontSize: 11, color: usagePercent >= 90 ? "#E53935" : "#888" }}>{usagePercent}%</span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span style={{ background: status.bg, color: status.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {status.label}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => toggleActive(p)}
                        style={{ background: p.active ? "#FFF3E0" : "#E8F5E9", color: p.active ? "#E65100" : "#2E7D32", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        {p.active ? "⏸ Tắt" : "▶ Bật"}
                      </button>
                      <button onClick={() => openEdit(p)}
                        style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>✏️</button>
                      <button onClick={() => handleDelete(p)}
                        style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 540, maxHeight: "94vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editPromo ? "✏️ Sửa voucher" : "🏷️ Tạo voucher mới"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Tên + Mã */}
              <div>
                <label style={lbl}>Tên chương trình *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Khuyến mãi hè 2025"
                  style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Mã voucher *</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SUMMER20"
                    style={{ ...inp, fontFamily: "monospace", fontWeight: 700, letterSpacing: 2 }} />
                </div>
                <div>
                  <label style={lbl}>Loại giảm giá *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Promo["type"] })} style={inp}>
                    <option value="PERCENT">% Phần trăm</option>
                    <option value="FIXED">Tiền cố định</option>
                  </select>
                </div>
              </div>

              {/* Giá trị */}
              <div style={{ background: "#f9f9f9", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#444", marginBottom: 12 }}>💰 Thiết lập giảm giá</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ ...lbl, color: "#F4B400" }}>
                      {form.type === "PERCENT" ? "Giảm (%) *" : "Giảm (đ) *"}
                    </label>
                    <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                      placeholder={form.type === "PERCENT" ? "20" : "50000"} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Đơn tối thiểu</label>
                    <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                      placeholder="300000" style={inp} />
                  </div>
                  {form.type === "PERCENT" && (
                    <div>
                      <label style={lbl}>Giảm tối đa (đ)</label>
                      <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                        placeholder="100000" style={inp} />
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Số lần dùng tối đa</label>
                    <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })}
                      placeholder="Không giới hạn" style={inp} />
                  </div>
                </div>

                {/* Preview */}
                {form.value && (
                  <div style={{ marginTop: 10, background: "#FFF8E1", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#555" }}>
                    🧮 Ví dụ đơn <b>1.000.000đ</b>: Giảm{" "}
                    <b style={{ color: "#E65100" }}>{fmt(previewDiscount())}</b>{" "}
                    → Còn <b style={{ color: "#2E7D32" }}>{fmt(previewAmount - previewDiscount())}</b>
                  </div>
                )}
              </div>

              {/* Thời gian */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Ngày bắt đầu *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Ngày kết thúc *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} style={inp} />
                </div>
              </div>

              {/* Active toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: "pointer" }} />
                <label htmlFor="active" style={{ fontSize: 13, fontWeight: 600, color: "#444", cursor: "pointer" }}>
                  Kích hoạt ngay sau khi tạo
                </label>
              </div>

              {msg && <div style={{ color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", fontSize: 13 }}>{msg}</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 2, padding: "12px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳ Đang lưu..." : "💾 Lưu voucher"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 };
const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #e8e8e8", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff" };
