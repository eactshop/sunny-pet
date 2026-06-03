"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 64 : 220,
        background: "#1A1A2E",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        flexShrink: 0,
        overflow: "hidden",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #F4B400, #E65100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🐾
          </div>
          {!collapsed && (
            <div>
              <div
                style={{
                  color: "#F4B400",
                  fontWeight: 800,
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >
                SUNNY PET
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 9,
                  marginTop: 2,
                }}
              >
                MANAGEMENT SYSTEM
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            fontSize: 16,
            padding: 4,
            flexShrink: 0,
          }}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 8px",
          overflowY: "auto",
        }}
      >
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "11px 14px",
                borderRadius: 10,
                background: active
                  ? "linear-gradient(135deg, rgba(244,180,0,0.2), rgba(244,180,0,0.08))"
                  : "transparent",
                color: active ? "#F4B400" : "rgba(255,255,255,0.55)",
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                marginBottom: 3,
                textDecoration: "none",
                borderLeft: active ? "3px solid #F4B400" : "3px solid transparent",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                justifyContent: collapsed ? "center" : "flex-start",
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "14px 12px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#F4B400",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              color: "#1A1A2E",
              flexShrink: 0,
            }}
          >
            A
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>
                Admin Sunny
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
                Chủ cửa hàng
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}