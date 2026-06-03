"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { key: "dashboard", icon: "📊", label: "Dashboard", href: "/dashboard" },
  { key: "products", icon: "📦", label: "Sản phẩm", href: "/dashboard/products" },
  { key: "inventory", icon: "🏪", label: "Kho hàng", href: "/dashboard/inventory" },
  { key: "orders", icon: "🛒", label: "Đơn hàng", href: "/dashboard/orders" },
  { key: "customers", icon: "👥", label: "Khách hàng", href: "/dashboard/customers" },
  { key: "pets", icon: "🐾", label: "Thú cưng", href: "/dashboard/pets" },
  { key: "spa", icon: "✂️", label: "Lịch Spa", href: "/dashboard/spa" },
  { key: "promotions", icon: "🏷️", label: "Khuyến mãi", href: "/dashboard/promotions" },
  { key: "reports", icon: "📈", label: "Báo cáo", href: "/dashboard/reports" },
  { key: "settings", icon: "⚙️", label: "Cài đặt", href: "/dashboard/settings" },
];

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Chủ cửa hàng",
  MANAGER: "Quản lý",
  STAFF: "Nhân viên",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.success) setCurrentUser(d.data); });
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F5F6FA" }}>
      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 64 : 220, background: "#1A1A2E",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease", flexShrink: 0,
        overflow: "hidden", height: "100vh",
        position: "sticky", top: 0,
      }}>
        {/* Logo */}
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
          <button onClick={() => setCollapsed(!collapsed)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14, padding: 4, flexShrink: 0 }}>
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.key} href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "11px 14px", borderRadius: 10,
                  background: active ? "linear-gradient(135deg,rgba(244,180,0,0.2),rgba(244,180,0,0.08))" : "transparent",
                  color: active ? "#F4B400" : "rgba(255,255,255,0.55)",
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  marginBottom: 3, textDecoration: "none",
                  borderLeft: active ? "3px solid #F4B400" : "3px solid transparent",
                  transition: "all 0.15s ease", whiteSpace: "nowrap",
                  justifyContent: collapsed ? "center" : "flex-start",
                  boxSizing: "border-box",
                }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* User in sidebar */}
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

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TOPBAR */}
        <header style={{
          background: "#fff", padding: "0 24px",
          display: "flex", alignItems: "center", gap: 16,
          height: 60, borderBottom: "1px solid #f0f0f0",
          flexShrink: 0, position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>
              {navItems.find(n => pathname.startsWith(n.href) && n.href !== "/dashboard" || pathname === n.href)?.icon}{" "}
              {navItems.find(n => pathname.startsWith(n.href) && n.href !== "/dashboard" || pathname === n.href)?.label}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Notification bell */}
            <button style={{ background: "#FFF8E1", color: "#F4B400", border: "none", padding: "8px 14px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              🔔 Thông báo
            </button>

            {/* User menu */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <div onClick={() => setShowMenu(!showMenu)}
                style={{ width: 38, height: 38, borderRadius: "50%", background: "#F4B400", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", cursor: "pointer", fontSize: 15, userSelect: "none" }}>
                {currentUser?.name?.charAt(0) || "A"}
              </div>

              {showMenu && (
                <div style={{
                  position: "absolute", right: 0, top: 46,
                  background: "#fff", borderRadius: 16,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  padding: 8, minWidth: 220, zIndex: 50,
                  border: "1px solid #f0f0f0",
                }}>
                  {/* User info */}
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

                  {/* Menu items */}
                  {[
                    { icon: "⚙️", label: "Cài đặt hệ thống", action: () => { setShowMenu(false); router.push("/dashboard/settings"); } },
                    { icon: "🔒", label: "Đổi mật khẩu", action: () => { setShowMenu(false); router.push("/dashboard/settings?tab=security"); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderRadius: 10, color: "#444", textAlign: "left" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f9f9f9")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}

                  <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 4, paddingTop: 4 }}>
                    <button onClick={handleLogout}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, borderRadius: 10, color: "#B71C1C", fontWeight: 600, textAlign: "left" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FFEBEE")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <span style={{ fontSize: 16 }}>🚪</span>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}