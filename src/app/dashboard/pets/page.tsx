"use client";
import { useState, useEffect, useCallback } from "react";

interface Pet {
  id: string; name: string; species: string; breed?: string;
  gender?: string; birthDate?: string; weight?: number; note?: string;
  customerId: string; ownerName: string; ownerPhone: string; createdAt: string;
}
interface Customer { id: string; name: string; phone: string; }

const SPECIES_EMOJI: Record<string, string> = {
  "Chó": "🐕", "Mèo": "🐈", "Thỏ": "🐇", "Chim": "🐦", "Cá": "🐠", "Khác": "🐾",
};

function getAge(birthDate?: string) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} tháng`;
  return `${Math.floor(months / 12)} tuổi ${months % 12 > 0 ? months % 12 + " tháng" : ""}`.trim();
}

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editPet, setEditPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", species: "Chó", breed: "", gender: "Đực",
    birthDate: "", weight: "", note: "", customerId: "",
  });

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("_t", Date.now().toString());
      const res = await fetch(`/api/pets?${params}`);
      const data = await res.json();
      if (data.success) setPets(data.data);
    } finally { setLoading(false); }
  }, [search]);

  const fetchCustomers = async () => {
    const res = await fetch("/api/customers?limit=100");
    const data = await res.json();
    if (data.success) setCustomers(data.data.items);
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchPets, 300);
    return () => clearTimeout(t);
  }, [fetchPets]);

  const openAdd = () => {
    setEditPet(null);
    setForm({ name: "", species: "Chó", breed: "", gender: "Đực", birthDate: "", weight: "", note: "", customerId: "" });
    setShowForm(true);
  };

  const openEdit = (p: Pet) => {
    setEditPet(p);
    setForm({
      name: p.name, species: p.species, breed: p.breed || "",
      gender: p.gender || "Đực",
      birthDate: p.birthDate ? p.birthDate.slice(0, 10) : "",
      weight: p.weight ? String(p.weight) : "",
      note: p.note || "", customerId: p.customerId,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.customerId) {
      setMsg("❌ Vui lòng nhập tên và chọn chủ nhân!");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    setSaving(true);
    try {
      const url = editPet ? `/api/pets/${editPet.id}` : "/api/pets";
      const method = editPet ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          species: form.species,
          breed: form.breed || null,
          gender: form.gender,
          birthDate: form.birthDate || null,
          weight: form.weight ? Number(form.weight) : null,
          note: form.note || null,
          customerId: form.customerId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(editPet ? "✅ Cập nhật thành công!" : "✅ Thêm thú cưng thành công!");
        setShowForm(false);
        fetchPets();
      } else {
        setMsg("❌ " + data.error);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleDelete = async (p: Pet) => {
    if (!confirm(`Xóa thú cưng "${p.name}"?`)) return;
    const res = await fetch(`/api/pets/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setMsg("✅ Đã xóa thú cưng!"); fetchPets(); }
    else setMsg("❌ " + data.error);
    setTimeout(() => setMsg(""), 3000);
  };

  const filtered = pets.filter(p => !speciesFilter || p.species === speciesFilter);
  const speciesList = ["Chó", "Mèo", "Thỏ", "Chim", "Cá", "Khác"];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>🐾 Quản lý thú cưng</h1>
        <button onClick={openAdd}
          style={{ background: "#F4B400", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          ＋ Thêm thú cưng
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ background: msg.startsWith("✅") ? "#E8F5E9" : "#FFEBEE", color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 500 }}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { icon: "🐾", label: "Tổng thú cưng", value: pets.length, color: "#F4B400" },
          { icon: "🐕", label: "Chó", value: pets.filter(p => p.species === "Chó").length, color: "#4CAF50" },
          { icon: "🐈", label: "Mèo", value: pets.filter(p => p.species === "Mèo").length, color: "#42A5F5" },
          { icon: "🐾", label: "Khác", value: pets.filter(p => !["Chó", "Mèo"].includes(p.species)).length, color: "#AB47BC" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên pet, giống, chủ nhân..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setSpeciesFilter("")}
            style={{ padding: "9px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: !speciesFilter ? "#F4B400" : "#f5f5f5", color: !speciesFilter ? "#fff" : "#666" }}>
            Tất cả
          </button>
          {["Chó", "Mèo", "Khác"].map(s => (
            <button key={s} onClick={() => setSpeciesFilter(speciesFilter === s ? "" : s)}
              style={{ padding: "9px 14px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: speciesFilter === s ? "#F4B400" : "#f5f5f5", color: speciesFilter === s ? "#fff" : "#666" }}>
              {SPECIES_EMOJI[s]} {s}
            </button>
          ))}
        </div>
      </div>

      {/* Pets grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#aaa", background: "#fff", borderRadius: 16 }}>Chưa có thú cưng nào</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: p.species === "Chó" ? "#E8F5E9" : p.species === "Mèo" ? "#E3F2FD" : "#FFF8E1",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0
                }}>
                  {SPECIES_EMOJI[p.species] || "🐾"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>{p.species}{p.breed ? ` — ${p.breed}` : ""}</div>
                </div>
                <span style={{
                  background: p.gender === "Đực" ? "#E3F2FD" : "#FCE4EC",
                  color: p.gender === "Đực" ? "#1565C0" : "#C2185B",
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600
                }}>
                  {p.gender === "Đực" ? "♂ Đực" : "♀ Cái"}
                </span>
              </div>

              {/* Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Tuổi", value: getAge(p.birthDate) || "—" },
                  { label: "Cân nặng", value: p.weight ? `${p.weight} kg` : "—" },
                ].map(info => (
                  <div key={info.label} style={{ background: "#f9f9f9", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#888" }}>{info.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>{info.value}</div>
                  </div>
                ))}
              </div>

              {/* Owner */}
              <div style={{ background: "#FFF8E1", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>👤</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#F57F17" }}>{p.ownerName}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{p.ownerPhone}</div>
                </div>
              </div>

              {/* Note */}
              {p.note && (
                <div style={{ fontSize: 12, color: "#888", background: "#f9f9f9", borderRadius: 8, padding: "8px 10px" }}>
                  📝 {p.note}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => openEdit(p)}
                  style={{ flex: 1, background: "#E3F2FD", color: "#1565C0", border: "none", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  ✏️ Sửa
                </button>
                <button onClick={() => handleDelete(p)}
                  style={{ flex: 1, background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  🗑️ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PET FORM MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {editPet ? "✏️ Sửa thú cưng" : "🐾 Thêm thú cưng mới"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Owner */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Chủ nhân *</label>
                <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}
                  disabled={!!editPet}>
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Tên thú cưng *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Miu, Lucky, Bông..."
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Species & Gender */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Loài *</label>
                  <select value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                    {speciesList.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Giới tính</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                    <option>Đực</option><option>Cái</option>
                  </select>
                </div>
              </div>

              {/* Breed */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Giống</label>
                <input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} placeholder="VD: Poodle, Golden Retriever, Mèo Anh lông ngắn..."
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Birth & Weight */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Ngày sinh</label>
                  <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Cân nặng (kg)</label>
                  <input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="0.0"
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Ghi chú</label>
                <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={3}
                  placeholder="Dị ứng, bệnh lý đặc biệt, tính cách..."
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              {/* Preview */}
              {form.name && (
                <div style={{ background: "#FFF8E1", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{SPECIES_EMOJI[form.species] || "🐾"}</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{form.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {form.species}{form.breed ? ` — ${form.breed}` : ""} | {form.gender}
                      {form.weight ? ` | ${form.weight}kg` : ""}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: "12px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳ Đang lưu..." : "💾 Lưu thú cưng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}