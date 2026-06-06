"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Chờ xác nhận", color: "#E65100", bg: "#FFF3E0" },
  PROCESSING: { label: "Đang xử lý",   color: "#F57F17", bg: "#FFF8E1" },
  SHIPPING:   { label: "Đang giao",    color: "#1565C0", bg: "#E3F2FD" },
  COMPLETED:  { label: "Hoàn thành",   color: "#2E7D32", bg: "#E8F5E9" },
  RETURNED:   { label: "Hoàn hàng",    color: "#6A1B9A", bg: "#F3E5F5" },
  CANCELLED:  { label: "Hủy đơn",      color: "#B71C1C", bg: "#FFEBEE" },
};

const STATUS_FLOW: Record<string, string[]> = {
  PENDING:    ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPING",   "CANCELLED"],
  SHIPPING:   ["COMPLETED",  "RETURNED"],
  COMPLETED:  ["RETURNED"],
  RETURNED:   [],
  CANCELLED:  [],
};

interface Order {
  id: string; code: string; status: string;
  customerName: string; customerPhone: string;
  subtotal: number; discount: number; total: number;
  note?: string; paymentMethod?: string; createdAt: string; items?: OrderItem[];
}

const PM_MAP: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  CASH:          { label: "Tiền mặt",    icon: "💵", color: "#2E7D32", bg: "#E8F5E9" },
  BANK_TRANSFER: { label: "Chuyển khoản", icon: "🏦", color: "#1565C0", bg: "#E3F2FD" },
};
interface OrderItem {
  id: string; productId: string; productName: string;
  productCode: string; quantity: number; price: number; subtotal: number;
}
interface Customer { id: string; name: string; phone: string; }
interface Product { id: string; code: string; name: string; sellPrice: number; stock: number; }

function printInvoice(order: Order, customerName: string, customerPhone: string) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  const items = order.items || [];
  win.document.write(`
    <!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>Hóa đơn ${order.code}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',sans-serif;padding:30px;font-size:14px;color:#222}
      .header{text-align:center;margin-bottom:24px;border-bottom:2px solid #F4B400;padding-bottom:16px}
      .logo{font-size:24px;font-weight:900;color:#F4B400}
      .sub{font-size:12px;color:#888;margin-top:2px}
      h2{font-size:18px;font-weight:700;text-align:center;margin:16px 0;text-transform:uppercase;letter-spacing:1px}
      .info{display:flex;justify-content:space-between;margin-bottom:20px;gap:20px}
      .info-block{flex:1}.info-block p{font-size:13px;margin-bottom:4px}
      .info-block span{color:#888}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th{background:#f5f5f5;padding:10px 12px;text-align:left;font-size:12px;color:#888;border-bottom:1px solid #e0e0e0}
      td{padding:10px 12px;border-bottom:1px solid #f5f5f5;font-size:13px}
      .total-section{margin-left:auto;width:260px}
      .total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
      .total-final{display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:800;border-top:2px solid #F4B400;color:#F4B400;margin-top:4px}
      .footer{text-align:center;margin-top:30px;font-size:12px;color:#888;border-top:1px solid #f0f0f0;padding-top:16px}
      @media print{body{padding:10px}}
    </style></head><body>
    <div class="header">
      <div class="logo">🐾 SUNNY PET</div>
      <div class="sub">MANAGEMENT SYSTEM</div>
      <div class="sub">ĐT: 0901 234 567</div>
    </div>
    <h2>Hóa đơn bán hàng</h2>
    <div class="info">
      <div class="info-block">
        <p><span>Mã đơn: </span><strong>${order.code}</strong></p>
        <p><span>Ngày: </span>${new Date(order.createdAt).toLocaleString("vi-VN")}</p>
        <p><span>Trạng thái: </span><strong>${STATUS_MAP[order.status]?.label || order.status}</strong></p>
      </div>
      <div class="info-block">
        <p><span>Khách hàng: </span><strong>${customerName}</strong></p>
        <p><span>SĐT: </span>${customerPhone}</p>
      </div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Mã SP</th><th>Tên sản phẩm</th><th style="text-align:right">Đơn giá</th><th style="text-align:center">SL</th><th style="text-align:right">Thành tiền</th></tr></thead>
      <tbody>
        ${items.map((item, i) => `<tr><td>${i+1}</td><td>${item.productCode}</td><td>${item.productName}</td><td style="text-align:right">${fmt(item.price)}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right"><strong>${fmt(item.subtotal)}</strong></td></tr>`).join("")}
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end">
      <div class="total-section">
        <div class="total-row"><span>Tạm tính:</span><span>${fmt(order.subtotal)}</span></div>
        ${order.discount > 0 ? `<div class="total-row"><span>Giảm giá:</span><span style="color:#E65100">-${fmt(order.discount)}</span></div>` : ""}
        <div class="total-final"><span>TỔNG CỘNG:</span><span>${fmt(order.total)}</span></div>
      </div>
    </div>
    ${order.note ? `<p style="font-size:13px;color:#888;margin-top:12px">📝 Ghi chú: ${order.note}</p>` : ""}
    <div class="footer">
      <p>Cảm ơn quý khách đã mua hàng tại Sunny Pet! 🐾</p>
      <p style="margin-top:4px">In ngày: ${new Date().toLocaleString("vi-VN")}</p>
    </div>
    </body></html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

export default function OrdersPage() {
  const { canDelete } = useAuth();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderItems, setOrderItems] = useState<{ productId: string; name: string; code: string; quantity: number; price: number; stock: number }[]>([]);
  const [discount, setDiscount] = useState("0");
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [saving, setSaving] = useState(false);
  const [customerTab, setCustomerTab] = useState<"existing" | "new">("existing");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", address: "" });

  const [showDetail, setShowDetail] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("_t", Date.now().toString());
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      if (data.success) setOrders(data.data.items);
    } finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { const t = setTimeout(fetchOrders, 300); return () => clearTimeout(t); }, [fetchOrders]);

  const fetchCustomers = async (q = "") => {
    const res = await fetch(`/api/customers?search=${q}&limit=20`);
    const data = await res.json();
    if (data.success) setCustomers(data.data.items);
  };

  const fetchProducts = async () => {
    const res = await fetch("/api/products?limit=100");
    const data = await res.json();
    if (data.success) setProducts(data.data.items);
  };

  const openCreate = async () => {
    await fetchCustomers();
    await fetchProducts();
    setSelectedCustomer(""); setCustomerSearch(""); setOrderItems([]);
    setDiscount("0"); setOrderNote(""); setPaymentMethod("CASH"); setCustomerTab("existing");
    setNewCustomer({ name: "", phone: "", address: "" });
    setShowCreate(true);
  };

  const addProduct = (p: Product) => {
    if (p.stock === 0) return;
    const existing = orderItems.find(i => i.productId === p.id);
    if (existing) {
      setOrderItems(prev => prev.map(i => i.productId === p.id && i.quantity < i.stock ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setOrderItems(prev => [...prev, { productId: p.id, name: p.name, code: p.code, quantity: 1, price: p.sellPrice, stock: p.stock }]);
    }
  };

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal - (Number(discount) || 0);

  const handleCreateOrder = async () => {
    if (customerTab === "existing" && !selectedCustomer) { setMsg("❌ Vui lòng chọn khách hàng!"); return; }
    if (customerTab === "new" && (!newCustomer.name || !newCustomer.phone)) { setMsg("❌ Vui lòng nhập tên và SĐT!"); return; }
    if (orderItems.length === 0) { setMsg("❌ Vui lòng chọn ít nhất 1 sản phẩm!"); return; }
    setSaving(true);
    try {
      let customerId = selectedCustomer;
      if (customerTab === "new") {
        const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCustomer) });
        const data = await res.json();
        if (!data.success) { setMsg("❌ " + data.error); setSaving(false); return; }
        customerId = data.data.id;
      }
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })), discount: Number(discount) || 0, note: orderNote, paymentMethod }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        fetchOrders();
        const orderRes = await fetch(`/api/orders/${data.data.id}`);
        const orderData = await orderRes.json();
        if (orderData.success) {
          const cName = customerTab === "new" ? newCustomer.name : customers.find(c => c.id === customerId)?.name || "";
          const cPhone = customerTab === "new" ? newCustomer.phone : customers.find(c => c.id === customerId)?.phone || "";
          if (confirm("✅ Tạo đơn thành công!\n\nBạn có muốn in hóa đơn không?")) {
            printInvoice(orderData.data, cName, cPhone);
          }
        }
        setMsg("✅ Tạo đơn hàng thành công!");
      } else { setMsg("❌ " + data.error); }
    } finally { setSaving(false); setTimeout(() => setMsg(""), 4000); }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await res.json();
    if (data.success) { setMsg("✅ Cập nhật trạng thái thành công!"); fetchOrders(); if (detailOrder?.id === orderId) setDetailOrder(data.data); }
    else setMsg("❌ " + data.error);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDelete = async (o: Order) => {
    if (!confirm(`Xóa đơn hàng ${o.code}? Thao tác không thể hoàn tác!`)) return;
    const res = await fetch(`/api/orders/${o.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setMsg("✅ Đã xóa đơn hàng!"); fetchOrders(); }
    else setMsg("❌ " + data.error);
    setTimeout(() => setMsg(""), 3000);
  };

  const openDetail = async (order: Order) => {
    const res = await fetch(`/api/orders/${order.id}`);
    const data = await res.json();
    if (data.success) { setDetailOrder(data.data); setShowDetail(true); }
  };

  const statusCounts = Object.keys(STATUS_MAP).reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>🛒 Quản lý đơn hàng</h1>
        <button onClick={openCreate} style={{ background: "#F4B400", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>＋ Tạo đơn hàng</button>
      </div>

      {msg && <div style={{ background: msg.startsWith("✅") ? "#E8F5E9" : "#FFEBEE", color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 500 }}>{msg}</div>}

      {/* Status cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 20 }}>
        {Object.entries(STATUS_MAP).map(([key, s]) => (
          <div key={key} onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
            style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: `3px solid ${s.color}`, cursor: "pointer", opacity: statusFilter && statusFilter !== key ? 0.5 : 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{statusCounts[key] || 0}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên khách hàng..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa" }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "9px 14px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 14, background: "#fafafa" }}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table / Card List */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#888" }}>⏳ Đang tải...</div>
        ) : isMobile ? (
          /* MOBILE: Card list */
          <div>
            {orders.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#aaa" }}>Chưa có đơn hàng</div>
            ) : orders.map(o => {
              const s = STATUS_MAP[o.status] || { label: o.status, color: "#666", bg: "#f5f5f5" };
              const nextStatuses = STATUS_FLOW[o.status] || [];
              return (
                <div key={o.id} style={{ padding: "14px 16px", borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#F4B400" }}>{o.code}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{o.customerName}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{o.customerPhone} · {new Date(o.createdAt).toLocaleDateString("vi-VN")}</div>
                      {o.paymentMethod && <span style={{ background: PM_MAP[o.paymentMethod]?.bg || "#f5f5f5", color: PM_MAP[o.paymentMethod]?.color || "#666", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-block", marginTop: 3 }}>{PM_MAP[o.paymentMethod]?.icon} {PM_MAP[o.paymentMethod]?.label}</span>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#222" }}>{fmt(o.total)}</div>
                      <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => openDetail(o)} style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>👁️ Chi tiết</button>
                    <button onClick={async () => { const res = await fetch(`/api/orders/${o.id}`); const data = await res.json(); if (data.success) printInvoice(data.data, o.customerName, o.customerPhone); }}
                      style={{ background: "#E8F5E9", color: "#2E7D32", border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>🖨️ In</button>
                    {nextStatuses.map(ns => (
                      <button key={ns} onClick={() => handleUpdateStatus(o.id, ns)}
                        style={{ background: STATUS_MAP[ns]?.bg, color: STATUS_MAP[ns]?.color, border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        → {STATUS_MAP[ns]?.label}
                      </button>
                    ))}
                    {canDelete && (
                      <button onClick={() => handleDelete(o)} style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>🗑️</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* DESKTOP: Table */
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9f9f9" }}>
                {["Mã ĐH", "Khách hàng", "Ngày tạo", "Sản phẩm", "Tổng tiền", "Thanh toán", "Trạng thái", "Thao tác"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, color: "#888", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#aaa" }}>Chưa có đơn hàng</td></tr>
              ) : orders.map(o => {
                const s = STATUS_MAP[o.status] || { label: o.status, color: "#666", bg: "#f5f5f5" };
                const nextStatuses = STATUS_FLOW[o.status] || [];
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#F4B400" }}>{o.code}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{o.customerName}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{o.customerPhone}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#888" }}>{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13 }}>{o.items?.length || 0} SP</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700 }}>{fmt(o.total)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {o.paymentMethod && <span style={{ background: PM_MAP[o.paymentMethod]?.bg, color: PM_MAP[o.paymentMethod]?.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{PM_MAP[o.paymentMethod]?.icon} {PM_MAP[o.paymentMethod]?.label}</span>}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <button onClick={() => openDetail(o)} style={{ background: "#E3F2FD", color: "#1565C0", border: "none", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11 }}>👁️ Chi tiết</button>
                        <button onClick={async () => { const res = await fetch(`/api/orders/${o.id}`); const data = await res.json(); if (data.success) printInvoice(data.data, o.customerName, o.customerPhone); }}
                          style={{ background: "#E8F5E9", color: "#2E7D32", border: "none", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11 }}>🖨️ In</button>
                        {nextStatuses.map(ns => (
                          <button key={ns} onClick={() => handleUpdateStatus(o.id, ns)}
                            style={{ background: STATUS_MAP[ns]?.bg, color: STATUS_MAP[ns]?.color, border: "none", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                            → {STATUS_MAP[ns]?.label}
                          </button>
                        ))}
                        {canDelete && (
                          <button onClick={() => handleDelete(o)} style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11 }}>🗑️ Xóa</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div style={{ padding: "12px 16px", fontSize: 13, color: "#888", borderTop: "1px solid #f0f0f0" }}>Tổng: {orders.length} đơn hàng</div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "20px 16px" : 28, width: isMobile ? "100%" : 720, maxHeight: isMobile ? "95vh" : "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🛒 Tạo đơn hàng mới</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 20 }}>
              {/* LEFT */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  {/* Customer tabs */}
                  <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 10, padding: 3, gap: 2, marginBottom: 10 }}>
                    {[{ key: "existing", label: "👥 Khách có sẵn" }, { key: "new", label: "🆕 Khách mới" }].map(t => (
                      <button key={t.key} onClick={() => setCustomerTab(t.key as any)}
                        style={{ flex: 1, padding: "7px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: customerTab === t.key ? "#fff" : "transparent", color: customerTab === t.key ? "#F4B400" : "#888", boxShadow: customerTab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {customerTab === "existing" ? (
                    <>
                      <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); fetchCustomers(e.target.value); }}
                        placeholder="Tìm khách hàng..."
                        style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 6 }} />
                      <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} size={4}
                        style={{ width: "100%", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 13, outline: "none", padding: 6 }}>
                        <option value="">-- Chọn khách hàng --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                      </select>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12, background: "#f9f9f9", borderRadius: 12 }}>
                      {[
                        { label: "Họ tên *", key: "name", placeholder: "Nguyễn Văn A" },
                        { label: "SĐT *", key: "phone", placeholder: "0901234567" },
                        { label: "Địa chỉ", key: "address", placeholder: "123 Đường ABC" },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>{f.label}</label>
                          <input value={(newCustomer as any)[f.key]} onChange={e => setNewCustomer({ ...newCustomer, [f.key]: e.target.value })}
                            placeholder={f.placeholder}
                            style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e8e8e8", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Products list */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Chọn sản phẩm</label>
                  <div style={{ maxHeight: 220, overflowY: "auto", border: "1.5px solid #e8e8e8", borderRadius: 10 }}>
                    {products.map(p => (
                      <div key={p.id} onClick={() => addProduct(p)}
                        style={{ padding: "8px 12px", cursor: p.stock > 0 ? "pointer" : "not-allowed", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f5f5f5", opacity: p.stock === 0 ? 0.4 : 1 }}
                        onMouseEnter={e => { if (p.stock > 0) e.currentTarget.style.background = "#f9f9f9"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#F4B400" }}>{p.code}</span>
                          <span style={{ fontSize: 13, marginLeft: 6 }}>{p.name}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#4CAF50" }}>{fmt(p.sellPrice)}</div>
                          <div style={{ fontSize: 10, color: "#888" }}>Tồn: {p.stock}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Sản phẩm đã chọn ({orderItems.length})</label>
                  {orderItems.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", color: "#aaa", border: "1.5px dashed #e8e8e8", borderRadius: 10, fontSize: 13 }}>Chọn sản phẩm từ danh sách</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                      {orderItems.map(item => (
                        <div key={item.productId} style={{ background: "#f9f9f9", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#F4B400" }}>{item.code}</div>
                            <div style={{ fontSize: 13 }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: "#4CAF50", fontWeight: 600 }}>{fmt(item.price)}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button onClick={() => setOrderItems(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                              style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>−</button>
                            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{item.quantity}</span>
                            <button onClick={() => setOrderItems(prev => prev.map(i => i.productId === item.productId && i.quantity < i.stock ? { ...i, quantity: i.quantity + 1 } : i))}
                              style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>+</button>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, minWidth: 70, textAlign: "right" }}>{fmt(item.price * item.quantity)}</div>
                          <button onClick={() => setOrderItems(prev => prev.filter(i => i.productId !== item.productId))}
                            style={{ background: "#FFEBEE", color: "#B71C1C", border: "none", width: 26, height: 26, borderRadius: "50%", cursor: "pointer", fontSize: 14 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Summary */}
                <div style={{ background: "#f9f9f9", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: "#666" }}>Tạm tính:</span><span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: "#666" }}>Giảm giá:</span>
                    <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                      style={{ width: 100, padding: "4px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
                  </div>
                  <div style={{ borderTop: "1px solid #e8e8e8", paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 16 }}>
                    <span style={{ fontWeight: 700 }}>Tổng cộng:</span>
                    <span style={{ fontWeight: 800, color: "#F4B400", fontSize: 18 }}>{fmt(total)}</span>
                  </div>
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
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 }}>Ghi chú</label>
                  <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={2}
                    style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} />
                </div>
                {msg && <div style={{ color: msg.startsWith("✅") ? "#2E7D32" : "#B71C1C", fontSize: 13 }}>{msg}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: "11px", background: "#f5f5f5", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                  <button onClick={handleCreateOrder} disabled={saving}
                    style={{ flex: 2, padding: "11px", background: saving ? "#ccc" : "#F4B400", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? "⏳ Đang tạo..." : "✅ Tạo đơn"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && detailOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "20px 16px" : 28, width: isMobile ? "100%" : 560, maxHeight: isMobile ? "95vh" : "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📋 Chi tiết đơn {detailOrder.code}</h2>
              <button onClick={() => setShowDetail(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ background: STATUS_MAP[detailOrder.status]?.bg, color: STATUS_MAP[detailOrder.status]?.color, padding: "6px 14px", borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                {STATUS_MAP[detailOrder.status]?.label}
              </span>
              {(STATUS_FLOW[detailOrder.status] || []).map(ns => (
                <button key={ns} onClick={() => handleUpdateStatus(detailOrder.id, ns)}
                  style={{ background: STATUS_MAP[ns]?.bg, color: STATUS_MAP[ns]?.color, border: "none", padding: "6px 14px", borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  → {STATUS_MAP[ns]?.label}
                </button>
              ))}
              <button onClick={() => printInvoice(detailOrder, detailOrder.customerName, detailOrder.customerPhone)}
                style={{ background: "#E8F5E9", color: "#2E7D32", border: "none", padding: "6px 14px", borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: "pointer", marginLeft: "auto" }}>
                🖨️ In hóa đơn
              </button>
            </div>
            <div style={{ background: "#f9f9f9", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>👤 Khách hàng</div>
              <div style={{ fontSize: 13 }}>Tên: <strong>{detailOrder.customerName}</strong></div>
              <div style={{ fontSize: 13 }}>SĐT: {detailOrder.customerPhone}</div>
              {detailOrder.paymentMethod && (
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#666" }}>Thanh toán:</span>
                  <span style={{ background: PM_MAP[detailOrder.paymentMethod]?.bg, color: PM_MAP[detailOrder.paymentMethod]?.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {PM_MAP[detailOrder.paymentMethod]?.icon} {PM_MAP[detailOrder.paymentMethod]?.label}
                  </span>
                </div>
              )}
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{new Date(detailOrder.createdAt).toLocaleString("vi-VN")}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>📦 Sản phẩm</div>
              {detailOrder.items?.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
                  <div><span style={{ fontWeight: 600, color: "#F4B400" }}>{item.productCode}</span> {item.productName} <span style={{ color: "#888" }}>× {item.quantity}</span></div>
                  <div style={{ fontWeight: 600 }}>{fmt(item.subtotal)}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#f9f9f9", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: "#666" }}>Tạm tính:</span><span>{fmt(detailOrder.subtotal)}</span></div>
              {detailOrder.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: "#666" }}>Giảm giá:</span><span style={{ color: "#E65100" }}>−{fmt(detailOrder.discount)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, borderTop: "1px solid #e8e8e8", paddingTop: 8 }}><span>Tổng cộng:</span><span style={{ color: "#F4B400" }}>{fmt(detailOrder.total)}</span></div>
            </div>
            {detailOrder.note && <div style={{ marginTop: 12, padding: "10px 14px", background: "#FFF8E1", borderRadius: 10, fontSize: 13, color: "#666" }}>📝 {detailOrder.note}</div>}
          </div>
        </div>
      )}
    </div>
  );
}