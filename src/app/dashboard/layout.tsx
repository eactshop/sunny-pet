"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";

const navItems = [
  { key: "dashboard", icon: "📊", label: "Dashboard", href: "/dashboard" },
  { key: "products",  icon: "📦", label: "Sản phẩm",  href: "/dashboard/products" },
  { key: "inventory", icon: "🏪", label: "Kho hàng",  href: "/dashboard/inventory" },
  { key: "orders",    icon: "🛒", label: "Đơn hàng",  href: "/dashboard/orders" },
  { key: "customers", icon: "👥", label: "Khách hàng",href: "/dashboard/customers" },
  { key: "pets",      icon: "🐾", label: "Thú cưng",  href: "/dashboard/pets" },
  { key: "spa",       icon: "✂️", label: "Lịch Spa",  href: "/dashboard/spa" },
  { key: "promotions",icon: "🏷️", label: "Khuyến mãi",href: "/dashboard/promotions" },
  { key: "reports",   icon: "📈", label: "Báo cáo",   href: "/dashboard/reports" },
  { key: "settings",  icon: "⚙️", label: "Cài đặt",   href: "/dashboard/settings" },
];

const STAFF_NAV_KEYS = ["orders", "customers"];

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Chủ cửa hàng", MANAGER: "Quản lý", STAFF: "Nhân viên",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeen, setLastSeen] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.success) setCurrentUser(d.data); });
    const saved = localStorage.getItem("notif_last_seen") || "";
    setLastSeen(saved);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const saved = localStorage.getItem("notif_last_seen") || "";
      const url = saved ? `/api/notifications?since=${encodeURIComponent(saved)}` : "/api/notifications";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.notifications.length);
      }
    } catch {}
  }, []);

  // Poll mỗi 30 giây
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  function handleOpenNotif() {
    setShowNotif(v => !v);
    setShowMenu(false);
    if (!showNotif) {
      const now = new Date().toISOString();
      localStorage.setItem("notif_last_seen", now);
      setLastSeen(now);
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setShowDrawer(false); }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const isStaff = currentUser?.role === "STAFF";
  const visibleNavItems = isStaff ? navItems.filter(n => STAFF_NAV_KEYS.includes(n.key)) : navItems;
  const bottomNavItems = isStaff
    ? visibleNavItems
    : navItems.filter(n => ["dashboard","orders","customers","spa","products"].includes(n.key));

  const activeItem = navItems.find(n => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href)));

  /* ──── MOBILE LAYOUT ──── */
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#F5F6FA", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        {/* MOBILE TOPBAR */}
        <header style={{ background: "#1A1A2E", padding: "0 16px", height: 56, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}>
          <button onClick={() => setShowDrawer(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1 }}>☰</button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#F4B400,#E65100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🐾</div>
            <div>
              <div style={{ color: "#F4B400", fontWeight: 800, fontSize: 12, lineHeight: 1 }}>SUNNY PET</div>
              {activeItem && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{activeItem.icon} {activeItem.label}</div>}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={handleOpenNotif}
              style={{ background: "rgba(244,180,0,0.15)", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, position: "relative" }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -2, right: -2, background: "#E53935", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
          <div ref={menuRef} style={{ position: "relative" }}>
            <div onClick={() => setShowMenu(!showMenu)} style={{ width: 34, height: 34, borderRadius: "50%", background: "#F4B400", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", cursor: "pointer", fontSize: 14 }}>
              {currentUser?.name?.charAt(0) || "A"}
            </div>
            {showMenu && (
              <div style={{ position: "absolute", right: 0, top: 42, background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", padding: 8, minWidth: 200, zIndex: 60, border: "1px solid #f0f0f0" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0", marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser?.name || "Admin"}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{currentUser?.email || ""}</div>
                  <span style={{ background: "#FFF3E0", color: "#E65100", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-block", marginTop: 4 }}>
                    {ROLE_LABEL[currentUser?.role] || "Nhân viên"}
                  </span>
                </div>
                {!isStaff && (
                  <button onClick={() => { setShowMenu(false); router.push("/dashboard/settings"); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderRadius: 10, color: "#444", textAlign: "left" }}>
                    ⚙️ Cài đặt
                  </button>
                )}
                <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderRadius: 10, color: "#B71C1C", fontWeight: 600, textAlign: "left" }}>
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* DRAWER OVERLAY */}
        {showDrawer && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setShowDrawer(false)}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 260, background: "#1A1A2E", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#F4B400,#E65100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐾</div>
                  <div>
                    <div style={{ color: "#F4B400", fontWeight: 800, fontSize: 13 }}>SUNNY PET</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>MANAGEMENT SYSTEM</div>
                  </div>
                </div>
                <button onClick={() => setShowDrawer(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>
              <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
                {visibleNavItems.map(item => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link key={item.key} href={item.href} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 10, textDecoration: "none", marginBottom: 3,
                      background: active ? "linear-gradient(135deg,rgba(244,180,0,0.2),rgba(244,180,0,0.08))" : "transparent",
                      color: active ? "#F4B400" : "rgba(255,255,255,0.65)",
                      fontWeight: active ? 600 : 400, fontSize: 14,
                      borderLeft: active ? "3px solid #F4B400" : "3px solid transparent",
                    }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span>{item.label}
                    </Link>
                  );
                })}
              </nav>
              <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F4B400", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#1A1A2E" }}>
                    {currentUser?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{currentUser?.name || "Admin"}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{ROLE_LABEL[currentUser?.role] || "Nhân viên"}</div>
                  </div>
                </div>
                <button onClick={handleLogout} style={{ width: "100%", padding: "10px", background: "rgba(183,28,28,0.15)", color: "#FF5252", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, overflow: "auto", padding: "16px", paddingBottom: 80 }}>{children}</main>

        {/* BOTTOM NAV */}
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1A1A2E", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", height: 64, zIndex: 40 }}>
          {bottomNavItems.map(item => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.key} href={item.href} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                textDecoration: "none", color: active ? "#F4B400" : "rgba(255,255,255,0.45)",
                fontSize: 10, fontWeight: active ? 600 : 400, position: "relative",
              }}>
                {active && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 32, height: 3, background: "#F4B400", borderRadius: "0 0 4px 4px" }} />}
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 9, whiteSpace: "nowrap" }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  /* ──── DESKTOP LAYOUT ──── */
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F5F6FA" }}>
      <aside style={{ width: collapsed ? 64 : 220, background: "#1A1A2E", display: "flex", flexDirection: "column", transition: "width 0.25s ease", flexShrink: 0, overflow: "hidden", height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#F4B400,#E65100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🐾</div>
            {!collapsed && (
              <div>
                <div style={{ color: "#F4B400", fontWeight: 800, fontSize: 13, lineHeight: 1 }}>SUNNY PET</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, marginTop: 2 }}>MANAGEMENT SYSTEM</div>
              </div>
            )}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14, padding: 4, flexShrink: 0 }}>
            {collapsed ? "→" : "←"}
          </button>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {visibleNavItems.map(item => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.key} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", borderRadius: 10,
                background: active ? "linear-gradient(135deg,rgba(244,180,0,0.2),rgba(244,180,0,0.08))" : "transparent",
                color: active ? "#F4B400" : "rgba(255,255,255,0.55)",
                fontWeight: active ? 600 : 400, fontSize: 13, marginBottom: 3, textDecoration: "none",
                borderLeft: active ? "3px solid #F4B400" : "3px solid transparent",
                transition: "all 0.15s ease", whiteSpace: "nowrap",
                justifyContent: collapsed ? "center" : "flex-start", boxSizing: "border-box",
              }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
        {!collapsed && (
          <div style={{ padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#F4B400", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#1A1A2E", flexShrink: 0 }}>
                {currentUser?.name?.charAt(0) || "A"}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser?.name || "Admin"}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{ROLE_LABEL[currentUser?.role] || "Nhân viên"}</div>
              </div>
            </div>
          </div>
        )}
      </aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ background: "#fff", padding: "0 24px", display: "flex", alignItems: "center", gap: 16, height: 60, borderBottom: "1px solid #f0f0f0", flexShrink: 0, position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>{activeItem?.icon} {activeItem?.label}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* NOTIFICATION BELL */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={handleOpenNotif}
                style={{ background: "#FFF8E1", color: "#F4B400", border: "none", padding: "8px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
                🔔 Thông báo
                {unreadCount > 0 && (
                  <span style={{ background: "#E53935", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 2 }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div style={{ position: "absolute", right: 0, top: 46, width: 360, background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 60, border: "1px solid #f0f0f0", overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>🔔 Thông báo gần đây</span>
                    <button onClick={fetchNotifications} style={{ background: "none", border: "none", fontSize: 12, color: "#888", cursor: "pointer" }}>🔄 Tải lại</button>
                  </div>
                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "#aaa", fontSize: 13 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                        Không có thông báo mới
                      </div>
                    ) : notifications.map((n: any) => (
                      <Link key={n.id} href={n.href} onClick={() => setShowNotif(false)}
                        style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: "1px solid #f9f9f9", textDecoration: "none", background: "#fff", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f9f9f9")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                          background: n.type === "order" ? "#FFF8E1" : "#E8F5E9" }}>
                          {n.type === "order" ? (n.source === "STORE" ? "🌐" : "🛒") : "✂️"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: "#666", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.body}</div>
                          <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>
                            {new Date(n.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            {n.status && (
                              <span style={{ marginLeft: 8, background: n.status === "PENDING" ? "#FFF3E0" : "#E8F5E9", color: n.status === "PENDING" ? "#E65100" : "#2E7D32", padding: "1px 6px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
                                {n.status === "PENDING" ? "Chờ xử lý" : n.status === "COMPLETED" ? "Hoàn thành" : n.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
                    <Link href="/dashboard/orders" onClick={() => setShowNotif(false)} style={{ fontSize: 12, color: "#F4B400", textDecoration: "none", fontWeight: 600 }}>
                      Xem tất cả đơn hàng →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div ref={menuRef} style={{ position: "relative" }}>
              <div onClick={() => setShowMenu(!showMenu)} style={{ width: 38, height: 38, borderRadius: "50%", background: "#F4B400", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", cursor: "pointer", fontSize: 15, userSelect: "none" }}>
                {currentUser?.name?.charAt(0) || "A"}
              </div>
              {showMenu && (
                <div style={{ position: "absolute", right: 0, top: 46, background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", padding: 8, minWidth: 220, zIndex: 50, border: "1px solid #f0f0f0" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #f0f0f0", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F4B400", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0 }}>
                        {currentUser?.name?.charAt(0) || "A"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser?.name || "Admin"}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{currentUser?.email || ""}</div>
                      </div>
                    </div>
                    <span style={{ background: "#FFF3E0", color: "#E65100", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      {ROLE_LABEL[currentUser?.role] || "Nhân viên"}
                    </span>
                  </div>
                  {!isStaff && [
                    { icon: "⚙️", label: "Cài đặt hệ thống", action: () => { setShowMenu(false); router.push("/dashboard/settings"); } },
                    { icon: "🔒", label: "Đổi mật khẩu", action: () => { setShowMenu(false); router.push("/dashboard/settings?tab=security"); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderRadius: 10, color: "#444", textAlign: "left" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f9f9f9")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 4, paddingTop: 4 }}>
                    <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderRadius: 10, color: "#B71C1C", fontWeight: 600, textAlign: "left" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FFEBEE")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <span style={{ fontSize: 16 }}>🚪</span>Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main style={{ flex: 1, overflow: "auto", padding: "24px" }}>{children}</main>
      </div>
    </div>
  );
}
