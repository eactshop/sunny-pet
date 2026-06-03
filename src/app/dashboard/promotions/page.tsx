"use client";
import { useState } from "react";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

const promotions = [
  { id: "KM001", code: "SUMMER20", name: "Khuyến mãi hè 2025", type: "PERCENT", value: 20, minOrder: 500000, startDate: "01/06/2025", endDate: "30/06/2025", active: true, used: 45 },
  { id: "KM002", code: "NEWPET50K", name: "Chào thú cưng mới", type: "FIXED", value: 50000, minOrder: 200000, startDate: "01/06/2025", endDate: "15/06/2025", active: true, used: 12 },
  { id: "KM003", code: "SPA30", name: "Giảm 30% dịch vụ spa", type: "PERCENT", value: 30, minOrder: 0, startDate: "01/05/2025", endDate: "31/05/2025", active: false, used: 88 },
  { id: "KM004", code: "COMBO2", name: "Mua 2 sữa tắm giảm 10%", type: "PERCENT", value: 10, minOrder: 0, startDate: "01/06/2025", endDate: "30/06/2025", active: true, used: 23 },
];

export default function PromotionsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>🏷️ Quản lý khuyến mãi</h1>
        <button onClick={() => setShowForm(true)} style={{ background: "#F4B400", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          ＋ Tạo mã giảm giá
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Đang hoạt động", value: promotions.filter(p => p.active).length, color: "#4CAF50", icon: "✅" },
          { label: "Đã hết hạn", value: promotions.filter(p => !p.active).length, color: "#888", icon: "⏰" },
          { label: "Lượt sử dụng", value: promotions.reduce((a, p) => a + p.used, 0), color: "#F4B400", icon: "🎫" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderLeft: `4px solid ${s.color}`, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Promotions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {promotions.map(p => (
          <div key={p.id} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 16 }}>
            {/* Code badge */}
            <div style={{ background: p.active ? "#FFF8E1" : "#f5f5f5", border: `2px dashed ${p.active ? "#F4B400" : "#ccc"}`, borderRadius: 12, padding: "12px 20px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: p.active ? "#F4B400" : "#aaa", letterSpacing: 2 }}>{p.code}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                {p.type === "PERCENT" ? `Giảm ${p.value}%` : `Giảm ${fmt(p.value)}`}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                {p.minOrder > 0 && `Đơn tối thiểu: ${fmt(p.minOrder)} • `}
                Hiệu lực: {p.startDate} — {p.endDate}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>🎫 Đã dùng: {p.used} lượt</div>
            </div>

            {/* Status */}
            <span style={{
              background: p.active ? "#E8F5E9" : "#f5f5f5",
              color: p.active ? "#2E7D32" : "#888",
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, flexShrink: 0
            }}>
              {p.active ? "✅ Đang hoạt động" : "⏰ Hết hạn"}
            </span>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>✏️ Sửa</button>
              <button style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add form modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🏷️ Tạo mã giảm giá</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["Tên chương trình *", "Mã voucher *", "Ngày bắt đầu *", "Ngày kết thúc *", "Đơn tối thiểu (đ)"].map(f => (
                <div key={f}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>{f}</label>
                  <input style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Loại giảm giá *</label>
                <select style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                  <option value="PERCENT">Giảm theo % (ví dụ: 20%)</option>
                  <option value="FIXED">Giảm tiền cố định (ví dụ: 50.000đ)</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button style={{ flex: 1, padding: "12px", background: "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>💾 Tạo mã</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}