"use client";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface User {
  id: string; name: string; email: string;
  role: string; active: boolean; createdAt: string;
}

const ROLE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  OWNER:   { label: "Chủ cửa hàng", color: "#E65100", bg: "#FFF3E0" },
  MANAGER: { label: "Quản lý",      color: "#1565C0", bg: "#E3F2FD" },
  STAFF:   { label: "Nhân viên",    color: "#2E7D32", bg: "#E8F5E9" },
};

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  // Add user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "STAFF" });

  // Change password form
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  // Reset password
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPwd, setNewPwd] = useState("");

  // Current user (from cookie/session - simplified)
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user from API
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.success) setCurrentUser(d.data); });
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success) setUsers(data.data.users);
    } finally { setLoading(false); }
  };

  const showMsg = (text: string, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      showMsg("Vui lòng điền đầy đủ thông tin!", "error"); return;
    }
    if (userForm.password.length < 6) {
      showMsg("Mật khẩu tối thiểu 6 ký tự!", "error"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("✅ Thêm tài khoản thành công!");
        setShowAddUser(false);
        setUserForm({ name: "", email: "", password: "", role: "STAFF" });
        fetchUsers();
      } else showMsg(data.error, "error");
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (user: User) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_active", userId: user.id, active: !user.active }),
    });
    const data = await res.json();
    if (data.success) { showMsg(user.active ? "✅ Đã khóa tài khoản" : "✅ Đã mở khóa tài khoản"); fetchUsers(); }
    else showMsg(data.error, "error");
  };

  const handleChangeRole = async (userId: string, role: string) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_role", userId, role }),
    });
    const data = await res.json();
    if (data.success) { showMsg("✅ Đã cập nhật quyền!"); fetchUsers(); }
    else showMsg(data.error, "error");
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Xóa tài khoản "${user.name}"? Không thể hoàn tác!`)) return;
    const res = await fetch(`/api/settings?userId=${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { showMsg("✅ Đã xóa tài khoản!"); fetchUsers(); }
    else showMsg(data.error, "error");
  };

  const handleChangePwd = async () => {
    if (!pwdForm.oldPassword || !pwdForm.newPassword) { showMsg("Vui lòng điền đầy đủ!", "error"); return; }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { showMsg("Mật khẩu xác nhận không khớp!", "error"); return; }
    if (pwdForm.newPassword.length < 6) { showMsg("Mật khẩu mới tối thiểu 6 ký tự!", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", userId: currentUser?.userId, oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword }),
      });
      const data = await res.json();
      if (data.success) { showMsg("✅ Đổi mật khẩu thành công!"); setShowChangePwd(false); setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" }); }
      else showMsg(data.error, "error");
    } finally { setSaving(false); }
  };

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 6) { showMsg("Mật khẩu tối thiểu 6 ký tự!", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", userId: resetTarget?.id, newPassword: newPwd }),
      });
      const data = await res.json();
      if (data.success) { showMsg("✅ Đặt lại mật khẩu thành công!"); setShowResetPwd(false); setNewPwd(""); }
      else showMsg(data.error, "error");
    } finally { setSaving(false); }
  };

  const tabs = [
    { key: "users",    icon: "👤", label: "Tài khoản & Phân quyền" },
    { key: "security", icon: "🔒", label: "Bảo mật" },
    { key: "about",    icon: "ℹ️",  label: "Thông tin hệ thống" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>⚙️ Cài đặt hệ thống</h1>
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{ background: msg.type === "error" ? "#FFEBEE" : "#E8F5E9", color: msg.type === "error" ? "#B71C1C" : "#2E7D32", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 500 }}>
          {msg.type !== "error" && "✅ "}{msg.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 24 }}>
        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, background: tab === t.key ? "#FFF8E1" : "transparent", color: tab === t.key ? "#F4B400" : "#555", fontWeight: tab === t.key ? 700 : 400, marginBottom: 2 }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>

          {/* USERS TAB */}
          {tab === "users" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>👤 Quản lý tài khoản</h2>
                <button onClick={() => setShowAddUser(true)}
                  style={{ background: "#F4B400", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  ＋ Thêm nhân viên
                </button>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {users.map(u => {
                    const r = ROLE_MAP[u.role] || { label: u.role, color: "#666", bg: "#f5f5f5" };
                    const isMe = currentUser?.userId === u.id;
                    return (
                      <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: "1.5px solid #f0f0f0", borderRadius: 12, opacity: u.active ? 1 : 0.6 }}>
                        {/* Avatar */}
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#F4B400", flexShrink: 0 }}>
                          {u.name.charAt(0)}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {u.name}
                            {isMe && <span style={{ marginLeft: 6, fontSize: 11, background: "#E8F5E9", color: "#2E7D32", padding: "2px 8px", borderRadius: 20 }}>Bạn</span>}
                          </div>
                          <div style={{ fontSize: 12, color: "#888" }}>{u.email}</div>
                        </div>
                        {/* Role selector */}
                        <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)}
                          disabled={isMe}
                          style={{ padding: "6px 10px", border: `1.5px solid ${r.color}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: r.color, background: r.bg, cursor: isMe ? "not-allowed" : "pointer", outline: "none" }}>
                          <option value="OWNER">Chủ cửa hàng</option>
                          <option value="MANAGER">Quản lý</option>
                          <option value="STAFF">Nhân viên</option>
                        </select>
                        {/* Status */}
                        <span style={{ background: u.active ? "#E8F5E9" : "#f5f5f5", color: u.active ? "#2E7D32" : "#888", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                          {u.active ? "Hoạt động" : "Đã khóa"}
                        </span>
                        {/* Actions */}
                        {!isMe && (
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button onClick={() => { setResetTarget(u); setNewPwd(""); setShowResetPwd(true); }}
                              style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11 }}>
                              🔑 Đặt lại MK
                            </button>
                            <button onClick={() => handleToggleActive(u)}
                              style={{ background: u.active ? "#FFF8E1" : "#E8F5E9", color: u.active ? "#F57F17" : "#2E7D32", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11 }}>
                              {u.active ? "🔒 Khóa" : "🔓 Mở"}
                            </button>
                            <button onClick={() => handleDeleteUser(u)}
                              style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11 }}>
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Role descriptions */}
              <div style={{ marginTop: 24, background: "#f9f9f9", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 10 }}>📋 Mô tả phân quyền</div>
                {[
                  { role: "OWNER", label: "Chủ cửa hàng", desc: "Toàn quyền: xem báo cáo, quản lý tài khoản, cấu hình hệ thống" },
                  { role: "MANAGER", label: "Quản lý", desc: "Quản lý đơn hàng, sản phẩm, khách hàng. Không xem lương/tài chính nội bộ" },
                  { role: "STAFF", label: "Nhân viên", desc: "Tạo đơn hàng, xem sản phẩm, quản lý lịch spa. Không xóa dữ liệu" },
                ].map(r => {
                  const rm = ROLE_MAP[r.role];
                  return (
                    <div key={r.role} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ background: rm.bg, color: rm.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{r.label}</span>
                      <span style={{ fontSize: 12, color: "#666" }}>{r.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {tab === "security" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px" }}>🔒 Bảo mật tài khoản</h2>

              {/* Current user info */}
              <div style={{ background: "#f9f9f9", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F4B400", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#fff" }}>
                  {currentUser?.name?.charAt(0) || "A"}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{currentUser?.name}</div>
                  <div style={{ fontSize: 13, color: "#888" }}>{currentUser?.email}</div>
                  <span style={{ background: ROLE_MAP[currentUser?.role]?.bg, color: ROLE_MAP[currentUser?.role]?.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    {ROLE_MAP[currentUser?.role]?.label}
                  </span>
                </div>
              </div>

              {/* Change password */}
              <div style={{ border: "1.5px solid #f0f0f0", borderRadius: 14, padding: "20px" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>🔑 Đổi mật khẩu</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 400 }}>
                  {[
                    { label: "Mật khẩu hiện tại", key: "oldPassword", type: "password" },
                    { label: "Mật khẩu mới", key: "newPassword", type: "password" },
                    { label: "Xác nhận mật khẩu mới", key: "confirmPassword", type: "password" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input type={f.type} value={(pwdForm as any)[f.key]}
                        onChange={e => setPwdForm({ ...pwdForm, [f.key]: e.target.value })}
                        placeholder="••••••••"
                        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                  {pwdForm.newPassword && pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword && (
                    <div style={{ color: "#B71C1C", fontSize: 12 }}>⚠️ Mật khẩu xác nhận không khớp</div>
                  )}
                  <button onClick={handleChangePwd} disabled={saving}
                    style={{ padding: "11px 24px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14, width: "fit-content" }}>
                    {saving ? "⏳ Đang lưu..." : "🔒 Đổi mật khẩu"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {tab === "about" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px" }}>ℹ️ Thông tin hệ thống</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#F4B400,#E65100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🐾</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#F4B400" }}>SUNNY PET</div>
                  <div style={{ fontSize: 12, color: "#888" }}>MANAGEMENT SYSTEM</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Phiên bản 1.0.0</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Framework", value: "Next.js 15 + TypeScript" },
                  { label: "Database", value: "MySQL + Prisma ORM" },
                  { label: "Authentication", value: "JWT (JSON Web Token)" },
                  { label: "UI Library", value: "Tailwind CSS + Recharts" },
                  { label: "Backend", value: "Next.js API Routes" },
                  { label: "Môi trường", value: "Node.js v24" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#f9f9f9", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, background: "#FFF8E1", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "#888" }}>
                💡 Hệ thống quản lý pet shop toàn diện — Đơn hàng, Kho hàng, Khách hàng, Thú cưng, Spa & Báo cáo
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "20px 16px" : 32, width: isMobile ? "100%" : 440, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>➕ Thêm nhân viên</h2>
              <button onClick={() => setShowAddUser(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Họ tên *", key: "name", type: "text", placeholder: "Nguyễn Văn A" },
                { label: "Email *", key: "email", type: "email", placeholder: "nv@sunnypet.vn" },
                { label: "Mật khẩu *", key: "password", type: "password", placeholder: "Tối thiểu 6 ký tự" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={(userForm as any)[f.key]}
                    onChange={e => setUserForm({ ...userForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Phân quyền *</label>
                <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }}>
                  <option value="STAFF">Nhân viên</option>
                  <option value="MANAGER">Quản lý</option>
                  <option value="OWNER">Chủ cửa hàng</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setShowAddUser(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleAddUser} disabled={saving}
                  style={{ flex: 1, padding: "12px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳..." : "💾 Thêm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetPwd && resetTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "20px 16px" : 32, width: isMobile ? "100%" : 400, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🔑 Đặt lại mật khẩu</h2>
              <button onClick={() => setShowResetPwd(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              Đặt lại mật khẩu cho: <strong>{resetTarget.name}</strong> ({resetTarget.email})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Mật khẩu mới *</label>
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Tối thiểu 6 ký tự"
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowResetPwd(false)} style={{ flex: 1, padding: "12px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleResetPwd} disabled={saving}
                  style={{ flex: 1, padding: "12px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳..." : "💾 Đặt lại"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}