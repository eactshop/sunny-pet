"use client";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; bar: string }> = {
  PENDING:     { label: "Chờ xác nhận",    color: "#E65100", bg: "#FFF3E0", bar: "#F4B400" },
  IN_PROGRESS: { label: "Đang thực hiện",  color: "#1565C0", bg: "#E3F2FD", bar: "#42A5F5" },
  COMPLETED:   { label: "Hoàn thành",      color: "#2E7D32", bg: "#E8F5E9", bar: "#4CAF50" },
  CANCELLED:   { label: "Đã hủy",          color: "#B71C1C", bg: "#FFEBEE", bar: "#EF5350" },
};

const STATUS_FLOW: Record<string, string[]> = {
  PENDING:     ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED:   [],
  CANCELLED:   [],
};

interface Appointment {
  id: string; status: string; date: string; note?: string; price: number;
  paymentMethod?: string;
  customerName: string; customerPhone: string;
  petName: string; petSpecies: string; petBreed?: string;
  serviceName: string; serviceDuration: number;
}

const PM_MAP: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  CASH:          { label: "Tiền mặt",     icon: "💵", color: "#2E7D32", bg: "#E8F5E9" },
  BANK_TRANSFER: { label: "Chuyển khoản", icon: "🏦", color: "#1565C0", bg: "#E3F2FD" },
};
interface Customer { id: string; name: string; phone: string; }
interface Pet { id: string; name: string; species: string; breed?: string; customerId: string; }
interface Service { id: string; name: string; price: number; duration: number; }

export default function SpaPage() {
  const isMobile = useIsMobile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"appointments" | "services">("appointments");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);

  // Service edit
  const [editService, setEditService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", duration: "" });
  const [showServiceForm, setShowServiceForm] = useState(false);

  const [form, setForm] = useState({
    customerId: "", petId: "", serviceId: "",
    date: "", time: "09:00", note: "", price: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (dateFilter) params.set("date", dateFilter);
      params.set("_t", Date.now().toString());
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      if (data.success) setAppointments(data.data.items);
    } finally { setLoading(false); }
  }, [statusFilter, dateFilter]);

  const fetchServices = useCallback(async () => {
    const res = await fetch("/api/services");
    const data = await res.json();
    if (data.success) setServices(data.data);
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch("/api/customers?limit=100");
    const data = await res.json();
    if (data.success) setCustomers(data.data.items);
  };

  const fetchPets = async (customerId?: string) => {
    const url = customerId ? `/api/pets?customerId=${customerId}` : "/api/pets";
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      if (customerId) setFilteredPets(data.data);
      else setPets(data.data);
    }
  };

  useEffect(() => { fetchServices(); }, [fetchServices]);
  useEffect(() => {
    const t = setTimeout(fetchAppointments, 300);
    return () => clearTimeout(t);
  }, [fetchAppointments]);

  const openCreate = async () => {
    setEditAppointment(null);
    await fetchCustomers();
    await fetchPets();
    const today = new Date().toISOString().slice(0, 10);
    setForm({ customerId: "", petId: "", serviceId: "", date: today, time: "09:00", note: "", price: "" });
    setPaymentMethod("CASH");
    setFilteredPets([]);
    setShowForm(true);
  };

  const openEdit = async (a: Appointment) => {
    setEditAppointment(a);
    await fetchCustomers();
    const dateObj = new Date(a.date);
    const date = dateObj.toISOString().slice(0, 10);
    const time = dateObj.toTimeString().slice(0, 5);

    // Find customerId
    const custRes = await fetch(`/api/customers?search=${a.customerName}&limit=5`);
    const custData = await custRes.json();
    const cust = custData.data?.items?.[0];
    if (cust) {
      await fetchPets(cust.id);
      // Find petId
      const petRes = await fetch(`/api/pets?customerId=${cust.id}`);
      const petData = await petRes.json();
      const pet = petData.data?.find((p: Pet) => p.name === a.petName);
      // Find serviceId
      const svc = services.find(s => s.name === a.serviceName);
      setForm({
        customerId: cust.id,
        petId: pet?.id || "",
        serviceId: svc?.id || "",
        date, time,
        note: a.note || "",
        price: String(a.price),
      });
      setPaymentMethod((a.paymentMethod as "CASH" | "BANK_TRANSFER") || "CASH");
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.customerId || !form.petId || !form.serviceId || !form.date) {
      setMsg("❌ Vui lòng điền đầy đủ thông tin!"); return;
    }
    setSaving(true);
    try {
      const dateTime = `${form.date}T${form.time}:00`;
      const payload = {
        customerId: form.customerId,
        petId: form.petId,
        serviceId: form.serviceId,
        date: dateTime,
        note: form.note,
        price: Number(form.price) || 0,
        paymentMethod,
      };

      const url = editAppointment ? `/api/appointments/${editAppointment.id}` : "/api/appointments";
      const method = editAppointment ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(editAppointment ? "✅ Cập nhật lịch thành công!" : "✅ Đặt lịch thành công!");
        setShowForm(false);
        fetchAppointments();
      } else {
        setMsg("❌ " + data.error);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg("✅ Cập nhật trạng thái thành công!");
      fetchAppointments();
    } else setMsg("❌ " + data.error);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa lịch hẹn này?")) return;
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setMsg("✅ Đã xóa lịch hẹn!"); fetchAppointments(); }
    setTimeout(() => setMsg(""), 3000);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.price) { setMsg("❌ Thiếu tên hoặc giá!"); return; }
    setSaving(true);
    try {
      const method = editService ? "PUT" : "POST";
      const body = editService
        ? { id: editService.id, ...serviceForm, price: Number(serviceForm.price), duration: Number(serviceForm.duration) }
        : { ...serviceForm, price: Number(serviceForm.price), duration: Number(serviceForm.duration) };
      const res = await fetch("/api/services", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { setMsg("✅ Lưu dịch vụ thành công!"); setShowServiceForm(false); fetchServices(); }
      else setMsg("❌ " + data.error);
    } finally { setSaving(false); setTimeout(() => setMsg(""), 3000); }
  };

  const statusCounts = Object.keys(STATUS_MAP).reduce((acc, s) => {
    acc[s] = appointments.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>✂️ Lịch Spa & Grooming</h1>
        <button onClick={openCreate}
          style={{ background: "#F4B400", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          ＋ Đặt lịch mới
        </button>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith("✅") ? "#E8F5E9" : "#FFEBEE", color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 500 }}>
          {msg}
        </div>
      )}

      {/* Status cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 20 }}>
        {Object.entries(STATUS_MAP).map(([key, s]) => (
          <div key={key} onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
            style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: `3px solid ${s.color}`, cursor: "pointer", opacity: statusFilter && statusFilter !== key ? 0.5 : 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{statusCounts[key] || 0}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f5f5f5", borderRadius: 12, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {[{ key: "appointments", label: "📅 Lịch hẹn" }, { key: "services", label: "💈 Dịch vụ & Bảng giá" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: "8px 20px", borderRadius: 9, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", background: tab === t.key ? "#fff" : "transparent", color: tab === t.key ? "#F4B400" : "#888", boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Appointments tab */}
      {tab === "appointments" && (
        <div>
          {/* Date filter */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
            <label style={{ fontSize: 13, color: "#666", fontWeight: 500 }}>📅 Ngày:</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              style={{ padding: "8px 12px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }} />
            {dateFilter && <button onClick={() => setDateFilter("")} style={{ background: "#f5f5f5", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#888" }}>✕ Xóa lọc</button>}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
          ) : appointments.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#aaa", background: "#fff", borderRadius: 16 }}>Chưa có lịch hẹn nào</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {appointments.map(a => {
                const s = STATUS_MAP[a.status] || STATUS_MAP.PENDING;
                const dateObj = new Date(a.date);
                const nextStatuses = STATUS_FLOW[a.status] || [];
                return (
                  <div key={a.id} style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "14px 14px" : "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 10 : 16, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                    <div style={{ width: 4, height: 64, borderRadius: 4, background: s.bar, flexShrink: 0 }} />
                    {/* Time */}
                    <div style={{ width: 70, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#222" }}>
                        {dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ fontSize: 10, color: "#888" }}>
                        {dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{a.customerName}
                        <span style={{ fontSize: 12, color: "#888", fontWeight: 400, marginLeft: 6 }}>{a.customerPhone}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#F4B400", fontWeight: 600 }}>
                        🐾 {a.petName} ({a.petSpecies}{a.petBreed ? ` — ${a.petBreed}` : ""})
                      </div>
                      <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                        💼 {a.serviceName} · ⏱️ {a.serviceDuration} phút
                      </div>
                      {a.note && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>📝 {a.note}</div>}
                    </div>
                    {/* Price & Status */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#4CAF50", marginBottom: 4 }}>{fmt(a.price)}</div>
                      {a.paymentMethod && <span style={{ background: PM_MAP[a.paymentMethod]?.bg, color: PM_MAP[a.paymentMethod]?.color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-block", marginBottom: 4 }}>{PM_MAP[a.paymentMethod]?.icon} {PM_MAP[a.paymentMethod]?.label}</span>}
                      <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                      {nextStatuses.map(ns => (
                        <button key={ns} onClick={() => handleUpdateStatus(a.id, ns)}
                          style={{ background: STATUS_MAP[ns]?.bg, color: STATUS_MAP[ns]?.color, border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                          → {STATUS_MAP[ns]?.label}
                        </button>
                      ))}
                      <button onClick={() => openEdit(a)}
                        style={{ background: "#f5f5f5", color: "#666", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11 }}>✏️ Sửa</button>
                      <button onClick={() => handleDelete(a.id)}
                        style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11 }}>🗑️ Xóa</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Services tab */}
      {tab === "services" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={() => { setEditService(null); setServiceForm({ name: "", price: "", duration: "60" }); setShowServiceForm(true); }}
              style={{ background: "#4CAF50", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              ＋ Thêm dịch vụ
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {services.map(s => {
              const icons: Record<string, string> = { "Tắm": "🛁", "Cắt tỉa lông": "✂️", "Vệ sinh tai": "👂", "Cắt móng": "💅", "Combo chăm sóc": "⭐" };
              const icon = icons[s.name] || "💈";
              return (
                <div key={s.id} style={{ background: "#fff", borderRadius: 16, padding: "22px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>⏱️ {s.duration} phút</div>
                  <div style={{ color: "#F4B400", fontWeight: 800, fontSize: 18, marginBottom: 14 }}>{fmt(s.price)}</div>
                  <button onClick={() => { setEditService(s); setServiceForm({ name: s.name, price: String(s.price), duration: String(s.duration) }); setShowServiceForm(true); }}
                    style={{ width: "100%", padding: "8px", background: "#FFF8E1", color: "#F57F17", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                    ✏️ Sửa giá
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BOOKING FORM MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "20px 16px" : 32, width: isMobile ? "100%" : 500, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editAppointment ? "✏️ Sửa lịch hẹn" : "📅 Đặt lịch spa"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Customer */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Khách hàng *</label>
                <select value={form.customerId}
                  onChange={e => { setForm({ ...form, customerId: e.target.value, petId: "" }); fetchPets(e.target.value); }}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
              </div>

              {/* Pet */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Thú cưng *</label>
                <select value={form.petId} onChange={e => setForm({ ...form, petId: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                  <option value="">-- Chọn thú cưng --</option>
                  {filteredPets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species}{p.breed ? ` — ${p.breed}` : ""})</option>)}
                </select>
              </div>

              {/* Service */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Dịch vụ *</label>
                <select value={form.serviceId}
                  onChange={e => {
                    const svc = services.find(s => s.id === e.target.value);
                    setForm({ ...form, serviceId: e.target.value, price: svc ? String(svc.price) : "" });
                  }}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                  <option value="">-- Chọn dịch vụ --</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} — {fmt(s.price)} ({s.duration} phút)</option>)}
                </select>
              </div>

              {/* Date & Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Ngày hẹn *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Giờ hẹn *</label>
                  <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              {/* Price */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Giá dịch vụ (đ)</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Payment Method */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 8 }}>💳 Hình thức thanh toán</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["CASH", "BANK_TRANSFER"] as const).map(pm => (
                    <button key={pm} onClick={() => setPaymentMethod(pm)}
                      style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: `2px solid ${paymentMethod === pm ? PM_MAP[pm].color : "#e8e8e8"}`, background: paymentMethod === pm ? PM_MAP[pm].bg : "#fff", color: paymentMethod === pm ? PM_MAP[pm].color : "#888", fontWeight: paymentMethod === pm ? 700 : 400, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}>
                      <span>{PM_MAP[pm].icon}</span>{PM_MAP[pm].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Ghi chú</label>
                <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2}
                  placeholder="Yêu cầu đặc biệt..."
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: "12px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳..." : "💾 Lưu lịch hẹn"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE FORM MODAL */}
      {showServiceForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "20px 16px" : 32, width: isMobile ? "100%" : 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editService ? "✏️ Sửa dịch vụ" : "➕ Thêm dịch vụ"}</h2>
              <button onClick={() => setShowServiceForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Tên dịch vụ *", key: "name", placeholder: "VD: Tắm, Cắt tỉa lông..." },
                { label: "Giá (đ) *", key: "price", placeholder: "80000", type: "number" },
                { label: "Thời gian (phút)", key: "duration", placeholder: "60", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type || "text"} value={(serviceForm as any)[f.key]}
                    onChange={e => setServiceForm({ ...serviceForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowServiceForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleSaveService} disabled={saving}
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