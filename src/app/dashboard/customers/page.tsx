"use client";
import { useState, useEffect, useCallback } from "react";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

interface Customer {
  id: string; name: string; phone: string; email?: string;
  address?: string; totalOrders: number; totalSpent: number;
  lastOrderAt?: string; petCount: number; createdAt: string;
}
interface Pet {
  id: string; name: string; species: string; breed?: string;
  gender?: string; birthDate?: string; weight?: number; note?: string;
  ownerName?: string;
}
interface Order {
  id: string; code: string; status: string; total: number; createdAt: string; itemCount: number;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "#E65100" },
  PROCESSING: { label: "Đang xử lý", color: "#F57F17" },
  SHIPPING: { label: "Đang giao", color: "#1565C0" },
  COMPLETED: { label: "Hoàn thành", color: "#2E7D32" },
  RETURNED: { label: "Hoàn hàng", color: "#6A1B9A" },
  CANCELLED: { label: "Hủy đơn", color: "#B71C1C" },
};

const SPECIES_EMOJI: Record<string, string> = {
  "Chó": "🐕", "Mèo": "🐈", "Thỏ": "🐇", "Chim": "🐦", "Cá": "🐠", "Khác": "🐾",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  // Customer form
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);

  // Pet form
  const [showPetForm, setShowPetForm] = useState(false);
  const [petCustomerId, setPetCustomerId] = useState("");
  const [petForm, setPetForm] = useState({
    name: "", species: "Chó", breed: "", gender: "Đực",
    birthDate: "", weight: "", note: "",
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${search}&limit=50&_t=${Date.now()}`);
      const data = await res.json();
      if (data.success) setCustomers(data.data.items);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const openAdd = () => {
    setEditCustomer(null);
    setForm({ name: "", phone: "", email: "", address: "" });
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setForm({ name: c.name, phone: c.phone, email: c.email || "", address: c.address || "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) { setMsg("❌ Vui lòng nhập tên và SĐT!"); return; }
    setSaving(true);
    try {
      const url = editCustomer ? `/api/customers/${editCustomer.id}` : "/api/customers";
      const method = editCustomer ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(editCustomer ? "✅ Cập nhật thành công!" : "✅ Thêm khách hàng thành công!");
        setShowForm(false);
        fetchCustomers();
      } else {
        setMsg("❌ " + data.error);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleDelete = async (c: Customer) => {
    if (!confirm(`Xóa khách hàng "${c.name}"? Thao tác này không thể hoàn tác!`)) return;
    const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setMsg("✅ Đã xóa khách hàng!"); fetchCustomers(); }
    else setMsg("❌ " + data.error);
    setTimeout(() => setMsg(""), 3000);
  };

  const openDetail = async (c: Customer) => {
    const res = await fetch(`/api/customers/${c.id}`);
    const data = await res.json();
    if (data.success) { setDetailCustomer(data.data); setShowDetail(true); }
  };

  const openAddPet = (customerId: string) => {
    setPetCustomerId(customerId);
    setPetForm({ name: "", species: "Chó", breed: "", gender: "Đực", birthDate: "", weight: "", note: "" });
    setShowPetForm(true);
  };

  const handleSavePet = async () => {
    if (!petForm.name) { setMsg("❌ Vui lòng nhập tên thú cưng!"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...petForm, customerId: petCustomerId }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("✅ Thêm thú cưng thành công!");
        setShowPetForm(false);
        // Refresh detail if open
        if (showDetail && detailCustomer?.id === petCustomerId) {
          const res2 = await fetch(`/api/customers/${petCustomerId}`);
          const data2 = await res2.json();
          if (data2.success) setDetailCustomer(data2.data);
        }
      } else {
        setMsg("❌ " + data.error);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm("Xóa thú cưng này?")) return;
    const res = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success && detailCustomer) {
      const res2 = await fetch(`/api/customers/${detailCustomer.id}`);
      const data2 = await res2.json();
      if (data2.success) setDetailCustomer(data2.data);
      setMsg("✅ Đã xóa thú cưng!");
      setTimeout(() => setMsg(""), 2000);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>👥 Quản lý khách hàng</h1>
        <button onClick={openAdd}
          style={{ background: "#F4B400", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          ＋ Thêm khách hàng
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ background: msg.startsWith("✅") ? "#E8F5E9" : "#FFEBEE", color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 500 }}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { icon: "👥", label: "Tổng khách hàng", value: customers.length, color: "#F4B400" },
          { icon: "⭐", label: "Khách VIP (>5tr)", value: customers.filter(c => c.totalSpent > 5000000).length, color: "#AB47BC" },
          { icon: "🐾", label: "Có thú cưng", value: customers.filter(c => c.petCount > 0).length, color: "#4CAF50" },
          { icon: "🆕", label: "Mới tháng này", value: customers.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length, color: "#42A5F5" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderLeft: `4px solid ${s.color}`, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc số điện thoại..."
          style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
      </div>

      {/* Customer list */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {customers.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#aaa", background: "#fff", borderRadius: 16 }}>Chưa có khách hàng nào</div>
          ) : customers.map(c => (
            <div key={c.id} style={{ background: "#fff", borderRadius: 16, padding: "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 16 }}>
              {/* Avatar */}
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#F4B400", flexShrink: 0 }}>
                {c.name.charAt(0)}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}
                  {c.totalSpent > 5000000 && <span style={{ marginLeft: 6, fontSize: 11, background: "#F3E5F5", color: "#6A1B9A", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>⭐ VIP</span>}
                </div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>📞 {c.phone}</div>
                {c.address && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {c.address}</div>}
                {c.petCount > 0 && <div style={{ fontSize: 12, color: "#4CAF50", marginTop: 2 }}>🐾 {c.petCount} thú cưng</div>}
              </div>
              {/* Stats */}
              <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#4CAF50" }}>{c.totalOrders}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Đơn hàng</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#42A5F5" }}>{c.spaCount || 0}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Lần spa</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#F4B400" }}>{fmt(c.totalSpent)}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Tổng chi tiêu</div>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => openDetail(c)} style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>👁️ Xem</button>
                <button onClick={() => openEdit(c)} style={{ background: "#E8F5E9", color: "#2E7D32", border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>✏️ Sửa</button>
                <button onClick={() => openAddPet(c.id)} style={{ background: "#FFF8E1", color: "#F57F17", border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>🐾 Thêm pet</button>
                <button onClick={() => handleDelete(c)} style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CUSTOMER FORM MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editCustomer ? "✏️ Sửa khách hàng" : "➕ Thêm khách hàng"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Họ tên *", key: "name", placeholder: "Nguyễn Văn A" },
                { label: "Số điện thoại *", key: "phone", placeholder: "0901234567" },
                { label: "Địa chỉ", key: "address", placeholder: "123 Đường ABC, Quận 1" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: "12px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳..." : "💾 Lưu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && detailCustomer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 620, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>👤 {detailCustomer.name}</h2>
              <button onClick={() => setShowDetail(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {/* Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Số điện thoại", value: detailCustomer.phone },
                { label: "Địa chỉ", value: detailCustomer.address || "—" },
                { label: "Tổng đơn hàng", value: detailCustomer.totalOrders },
                { label: "Tổng chi tiêu", value: fmt(detailCustomer.totalSpent) },
                { label: "Ngày tạo", value: new Date(detailCustomer.createdAt).toLocaleDateString("vi-VN") },
              ].map(item => (
                <div key={item.label} style={{ background: "#f9f9f9", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Pets */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>🐾 Thú cưng ({detailCustomer.pets?.length || 0})</div>
                <button onClick={() => { setShowDetail(false); openAddPet(detailCustomer.id); }}
                  style={{ background: "#FFF8E1", color: "#F57F17", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  ＋ Thêm pet
                </button>
              </div>
              {detailCustomer.pets?.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#aaa", background: "#f9f9f9", borderRadius: 10, fontSize: 13 }}>Chưa có thú cưng</div>
              ) : detailCustomer.pets?.map((pet: Pet) => (
                <div key={pet.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f9f9f9", borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{SPECIES_EMOJI[pet.species] || "🐾"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{pet.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {pet.species}{pet.breed ? ` — ${pet.breed}` : ""}{pet.gender ? ` | ${pet.gender}` : ""}{pet.weight ? ` | ${pet.weight}kg` : ""}
                    </div>
                    {pet.note && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>📝 {pet.note}</div>}
                  </div>
                  <button onClick={() => handleDeletePet(pet.id)}
                    style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>🗑️</button>
                </div>
              ))}
            </div>

            {/* Orders */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🛒 Đơn hàng gần đây</div>
              {detailCustomer.orders?.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#aaa", background: "#f9f9f9", borderRadius: 10, fontSize: 13 }}>Chưa có đơn hàng</div>
              ) : detailCustomer.orders?.map((o: Order) => {
                const s = STATUS_LABEL[o.status] || { label: o.status, color: "#666" };
                return (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9f9f9", borderRadius: 10, marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "#F4B400", fontSize: 13 }}>{o.code}</span>
                      <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{fmt(o.total)}</span>
                      <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PET FORM MODAL */}
      {showPetForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🐾 Thêm thú cưng</h2>
              <button onClick={() => setShowPetForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Tên thú cưng *</label>
                <input value={petForm.name} onChange={e => setPetForm({ ...petForm, name: e.target.value })} placeholder="VD: Miu, Lucky..."
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Loài *</label>
                  <select value={petForm.species} onChange={e => setPetForm({ ...petForm, species: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                    {["Chó", "Mèo", "Thỏ", "Chim", "Cá", "Khác"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Giới tính</label>
                  <select value={petForm.gender} onChange={e => setPetForm({ ...petForm, gender: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                    <option>Đực</option><option>Cái</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Giống</label>
                  <input value={petForm.breed} onChange={e => setPetForm({ ...petForm, breed: e.target.value })} placeholder="VD: Poodle, Mèo Anh..."
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Cân nặng (kg)</label>
                  <input type="number" value={petForm.weight} onChange={e => setPetForm({ ...petForm, weight: e.target.value })} placeholder="0"
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Ngày sinh</label>
                <input type="date" value={petForm.birthDate} onChange={e => setPetForm({ ...petForm, birthDate: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Ghi chú</label>
                <textarea value={petForm.note} onChange={e => setPetForm({ ...petForm, note: e.target.value })} rows={2}
                  placeholder="Dị ứng, bệnh lý đặc biệt..."
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowPetForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleSavePet} disabled={saving}
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