"use client";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Banner {
  id: string; imageUrl: string; title?: string; link?: string; order: number; active: boolean;
}

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

  // Banner state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState("");
  const [bannerForm, setBannerForm] = useState({ imageUrl: "", title: "", link: "", order: "0", active: true });
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.success) setCurrentUser(d.data); });
    fetchUsers();
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setBannerLoading(true);
    try {
      const res = await fetch("/api/banners?all=1");
      const data = await res.json();
      if (data.success) setBanners(data.data);
    } finally { setBannerLoading(false); }
  };

  const handleBannerUpload = async (file: File) => {
    setBannerUploading(true);
    setBannerUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        if (editBanner) setEditBanner(b => b ? { ...b, imageUrl: data.url } : b);
        else setBannerForm(f => ({ ...f, imageUrl: data.url }));
      } else {
        setBannerUploadError(data.error || "Upload thất bại");
      }
    } catch (err: any) {
      setBannerUploadError(err.message || "Lỗi kết nối");
    } finally { setBannerUploading(false); }
  };

  const handleAddBanner = async () => {
    if (!bannerForm.imageUrl) { showMsg("Vui lòng chọn ảnh banner!", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/banners", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bannerForm, order: Number(bannerForm.order) }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("✅ Đã thêm banner!");
        setShowAddBanner(false);
        setBannerForm({ imageUrl: "", title: "", link: "", order: "0", active: true });
        fetchBanners();
      } else showMsg(data.error, "error");
    } finally { setSaving(false); }
  };

  const handleUpdateBanner = async () => {
    if (!editBanner || !editBanner.imageUrl) { showMsg("Vui lòng chọn ảnh!", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/banners/${editBanner.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editBanner),
      });
      const data = await res.json();
      if (data.success) { showMsg("✅ Đã cập nhật banner!"); setEditBanner(null); fetchBanners(); }
      else showMsg(data.error, "error");
    } finally { setSaving(false); }
  };

  const handleToggleBanner = async (b: Banner) => {
    const res = await fetch(`/api/banners/${b.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...b, active: !b.active }),
    });
    const data = await res.json();
    if (data.success) { showMsg(b.active ? "✅ Đã ẩn banner" : "✅ Đã hiện banner"); fetchBanners(); }
    else showMsg(data.error, "error");
  };

  const handleDeleteBanner = async (b: Banner) => {
    if (!confirm(`Xóa banner "${b.title || b.imageUrl}"?`)) return;
    const res = await fetch(`/api/banners/${b.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { showMsg("✅ Đã xóa banner!"); fetchBanners(); }
    else showMsg(data.error, "error");
  };

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
    { key: "banner",   icon: "🖼️", label: "Banner trang chủ" },
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

          {/* BANNER TAB */}
          {tab === "banner" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>🖼️ Banner trang chủ</h2>
                  <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>Ảnh sẽ hiển thị dạng carousel trên trang chủ cửa hàng</p>
                </div>
                <button onClick={() => { setBannerForm({ imageUrl: "", title: "", link: "", order: String(banners.length), active: true }); setShowAddBanner(true); }}
                  style={{ background: "#F4B400", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  ＋ Thêm banner
                </button>
              </div>

              {bannerLoading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
              ) : banners.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#aaa", border: "2px dashed #eee", borderRadius: 14 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
                  <p>Chưa có banner nào. Thêm ảnh để hiển thị trên trang chủ.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {banners.map((b, idx) => (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: "1.5px solid #f0f0f0", borderRadius: 14, opacity: b.active ? 1 : 0.55 }}>
                      {/* Thumbnail */}
                      <div style={{ width: 100, height: 60, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f5f5f5" }}>
                        <img src={b.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{b.title || <span style={{ color: "#aaa" }}>Chưa có tiêu đề</span>}</div>
                        {b.link && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>🔗 {b.link}</div>}
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Thứ tự: {b.order}</div>
                      </div>
                      {/* Status */}
                      <span style={{ background: b.active ? "#E8F5E9" : "#f5f5f5", color: b.active ? "#2E7D32" : "#888", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                        {b.active ? "Hiển thị" : "Ẩn"}
                      </span>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setEditBanner({ ...b })}
                          style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11 }}>
                          ✏️ Sửa
                        </button>
                        <button onClick={() => handleToggleBanner(b)}
                          style={{ background: b.active ? "#FFF8E1" : "#E8F5E9", color: b.active ? "#F57F17" : "#2E7D32", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11 }}>
                          {b.active ? "🙈 Ẩn" : "👁️ Hiện"}
                        </button>
                        <button onClick={() => handleDeleteBanner(b)}
                          style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11 }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview note */}
              {banners.length > 0 && (
                <div style={{ marginTop: 16, background: "#FFF8E1", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#888" }}>
                  💡 Trang chủ cập nhật ảnh sau tối đa 60 giây. Thứ tự hiển thị theo cột "Thứ tự" (nhỏ hơn = trước).
                </div>
              )}
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

      {/* ADD BANNER MODAL */}
      {showAddBanner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "20px 16px" : 32, width: isMobile ? "100%" : 480, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🖼️ Thêm banner mới</h2>
              <button onClick={() => setShowAddBanner(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Image upload */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 8 }}>Ảnh banner *</label>
                <div style={{ position: "relative", border: "2px dashed #F4B400", borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer", background: "#FFFDE7", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, overflow: "hidden" }}>
                  {bannerForm.imageUrl ? (
                    <img src={bannerForm.imageUrl} alt="" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 8, objectFit: "contain", pointerEvents: "none" }} />
                  ) : bannerUploading ? (
                    <div style={{ color: "#F4B400", pointerEvents: "none" }}>⏳ Đang tải ảnh...</div>
                  ) : (
                    <div style={{ pointerEvents: "none" }}>
                      <div style={{ fontSize: 32 }}>📤</div>
                      <div style={{ fontSize: 13, color: "#888" }}>Click để chọn ảnh banner</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>Khuyến nghị: 1200×400px hoặc tỷ lệ 3:1</div>
                    </div>
                  )}
                  <input type="file" accept="image/*"
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); e.target.value = ""; }} />
                </div>
                {bannerUploadError && <div style={{ color: "#B71C1C", fontSize: 12, marginTop: 6 }}>⚠️ {bannerUploadError}</div>}
              </div>
              {/* Title */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Tiêu đề (không bắt buộc)</label>
                <input type="text" value={bannerForm.title} onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Khuyến mãi tháng 6"
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              {/* Link */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Liên kết khi click (không bắt buộc)</label>
                <input type="text" value={bannerForm.link} onChange={e => setBannerForm(f => ({ ...f, link: e.target.value }))} placeholder="VD: /san-pham?categoryId=abc"
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              {/* Order */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Thứ tự hiển thị</label>
                <input type="number" value={bannerForm.order} onChange={e => setBannerForm(f => ({ ...f, order: e.target.value }))} min="0"
                  style={{ width: 120, padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }} />
              </div>
              {/* Active */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={bannerForm.active} onChange={e => setBannerForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 18, height: 18, accentColor: "#F4B400" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Hiển thị ngay trên trang chủ</span>
              </label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowAddBanner(false)} style={{ flex: 1, padding: 12, background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleAddBanner} disabled={saving || bannerUploading}
                  style={{ flex: 1, padding: 12, background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳..." : "💾 Thêm banner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BANNER MODAL */}
      {editBanner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "20px 16px" : 32, width: isMobile ? "100%" : 480, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>✏️ Sửa banner</h2>
              <button onClick={() => setEditBanner(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 8 }}>Ảnh banner *</label>
                <div style={{ position: "relative", border: "2px dashed #F4B400", borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer", background: "#FFFDE7", minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, overflow: "hidden" }}>
                  {editBanner.imageUrl ? (
                    <img src={editBanner.imageUrl} alt="" style={{ maxHeight: 140, maxWidth: "100%", borderRadius: 8, objectFit: "contain", pointerEvents: "none" }} />
                  ) : bannerUploading ? (
                    <div style={{ color: "#F4B400", pointerEvents: "none" }}>⏳ Đang tải...</div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#888", pointerEvents: "none" }}>📤 Click để đổi ảnh</div>
                  )}
                  <input type="file" accept="image/*"
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); e.target.value = ""; }} />
                </div>
                {bannerUploadError && <div style={{ color: "#B71C1C", fontSize: 12, marginTop: 6 }}>⚠️ {bannerUploadError}</div>}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Tiêu đề</label>
                <input type="text" value={editBanner.title || ""} onChange={e => setEditBanner(b => b ? { ...b, title: e.target.value } : b)} placeholder="VD: Khuyến mãi tháng 6"
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Liên kết khi click</label>
                <input type="text" value={editBanner.link || ""} onChange={e => setEditBanner(b => b ? { ...b, link: e.target.value } : b)} placeholder="/san-pham"
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Thứ tự</label>
                <input type="number" value={editBanner.order} onChange={e => setEditBanner(b => b ? { ...b, order: Number(e.target.value) } : b)} min="0"
                  style={{ width: 120, padding: "10px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={editBanner.active} onChange={e => setEditBanner(b => b ? { ...b, active: e.target.checked } : b)} style={{ width: 18, height: 18, accentColor: "#F4B400" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Hiển thị trên trang chủ</span>
              </label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setEditBanner(null)} style={{ flex: 1, padding: 12, background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                <button onClick={handleUpdateBanner} disabled={saving || bannerUploading}
                  style={{ flex: 1, padding: 12, background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "⏳..." : "💾 Lưu thay đổi"}
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