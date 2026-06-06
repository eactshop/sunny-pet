"use client";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Chờ xác nhận", color: "#E65100", bg: "#FFF3E0" },
  PROCESSING: { label: "Đang xử lý",   color: "#F57F17", bg: "#FFF8E1" },
  SHIPPING:   { label: "Đang giao",    color: "#1565C0", bg: "#E3F2FD" },
  COMPLETED:  { label: "Hoàn thành",   color: "#2E7D32", bg: "#E8F5E9" },
  RETURNED:   { label: "Hoàn hàng",    color: "#6A1B9A", bg: "#F3E5F5" },
  CANCELLED:  { label: "Hủy đơn",      color: "#B71C1C", bg: "#FFEBEE" },
};

const SPA_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:     { label: "Chờ",            color: "#E65100", bg: "#FFF3E0" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "#1565C0", bg: "#E3F2FD" },
  COMPLETED:   { label: "Hoàn thành",     color: "#2E7D32", bg: "#E8F5E9" },
  CANCELLED:   { label: "Đã hủy",         color: "#B71C1C", bg: "#FFEBEE" },
};

function StatCard({ icon, label, value, sub, color, sub2 }: any) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", borderLeft: `4px solid ${color}`, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#222", lineHeight: 1.2 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{sub}</div>}
        {sub2 && <div style={{ fontSize: 11, color: "#aaa" }}>{sub2}</div>}
      </div>
    </div>
  );
}

const REPORT_TABS = [
  { key: "day",   label: "Ngày" },
  { key: "week",  label: "Tuần" },
  { key: "month", label: "Tháng" },
  { key: "year",  label: "Năm" },
];

const SOURCE_TABS = [
  { key: "all",   label: "Tổng hợp", color: "#F4B400" },
  { key: "order", label: "Bán hàng", color: "#4CAF50" },
  { key: "spa",   label: "Spa",      color: "#42A5F5" },
];

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("month");
  const [sourceType, setSourceType] = useState("all");
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard?_t=${Date.now()}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const fetchReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/dashboard?reportType=${reportType}&_t=${Date.now()}`);
      const d = await res.json();
      if (d.success) setReportData(d.data.reportData);
    } finally { setReportLoading(false); }
  }, [reportType]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 36 }}>🐾</div>
      <div style={{ fontSize: 15, color: "#888" }}>Đang tải dữ liệu...</div>
    </div>
  );

  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>❌ Không thể tải dữ liệu</div>;

  // Chart data based on source type
  const getChartData = () => {
    if (!reportData?.chartData) return [];
    return reportData.chartData.map((r: any) => ({
      label: r.label,
      revenue: sourceType === "all" ? r.total : sourceType === "order" ? r.orderRevenue : r.spaRevenue,
      "Bán hàng": r.orderRevenue,
      "Spa": r.spaRevenue,
      "Tổng": r.total,
    }));
  };

  const getSummary = () => {
    if (!reportData) return { revenue: 0, count: 0 };
    if (sourceType === "all") return { revenue: reportData.totalRev, count: reportData.totalOrderCount + reportData.totalSpaCount };
    if (sourceType === "order") return { revenue: reportData.totalOrderRev, count: reportData.totalOrderCount };
    return { revenue: reportData.totalSpaRev, count: reportData.totalSpaCount };
  };

  const summary = getSummary();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20 }}>
      {/* Refresh button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => { setLoading(true); fetch(`/api/dashboard?_t=${Date.now()}`).then(r => r.json()).then(d => { if (d.success) setData(d.data); }).finally(() => setLoading(false)); fetchReport(); }}
          style={{ background: "#f5f5f5", border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: 6 }}
        >
          🔄 Cập nhật số liệu
        </button>
      </div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(190px, 1fr))", gap: isMobile ? 10 : 14 }}>
        <StatCard icon="💰" label="Doanh thu hôm nay" value={fmt(data.todayRevenue)}
          sub={`🛒 ${fmt(data.todayOrderRevenue)}`} sub2={`✂️ ${fmt(data.todaySpaRevenue)}`} color="#F4B400" />
        <StatCard icon="📅" label="Doanh thu tháng này" value={fmt(data.monthRevenue)}
          sub={`🛒 ${fmt(data.monthOrderRevenue)}`} sub2={`✂️ ${fmt(data.monthSpaRevenue)}`} color="#4CAF50" />
        <StatCard icon="✅" label="Doanh thu thực (tháng)" value={fmt(data.netMonthRevenue || 0)}
          sub={`Sau trừ hoàn hàng`} color="#2E7D32" />
        <StatCard icon="↩️" label="Đã hoàn hàng (tháng)" value={fmt(data.returnedRevMonth || 0)}
          sub={`${data.returnedOrders} đơn hoàn`} color="#FF7043" />
        <StatCard icon="❌" label="Đơn hủy (tháng)" value={data.cancelledOrders || 0}
          sub="Số đơn bị hủy" color="#B71C1C" />
        <StatCard icon="📦" label="Tổng đơn hàng" value={data.totalOrders} sub="Tháng này (trừ hủy)" color="#42A5F5" />
        <StatCard icon="🚚" label="Đang giao" value={data.shippingOrders} sub="Cần xử lý" color="#FF7043" />
        <StatCard icon="✂️" label="Lịch spa hôm nay" value={data.todaySpaCount} sub="Đã đặt" color="#AB47BC" />
        <StatCard icon="👤" label="Khách hàng mới" value={data.newCustomers} sub="Tháng này" color="#26A69A" />
        <StatCard icon="💵" label="Tiền mặt (tháng này)" value={fmt(data.monthCashRevenue || 0)} sub={`${data.monthCashCount || 0} đơn`} color="#2E7D32" />
        <StatCard icon="🏦" label="Chuyển khoản (tháng)" value={fmt(data.monthBankRevenue || 0)} sub={`${data.monthBankCount || 0} đơn`} color="#1565C0" />
      </div>

      {/* ── BÁO CÁO DOANH THU ── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "16px" : "22px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#222" }}>📊 Báo cáo doanh thu</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Period tabs */}
            <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 10, padding: 3, gap: 2 }}>
              {REPORT_TABS.map(t => (
                <button key={t.key} onClick={() => setReportType(t.key)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: reportType === t.key ? "#fff" : "transparent", color: reportType === t.key ? "#F4B400" : "#888", boxShadow: reportType === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* Source tabs */}
            <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 10, padding: 3, gap: 2 }}>
              {SOURCE_TABS.map(t => (
                <button key={t.key} onClick={() => setSourceType(t.key)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: sourceType === t.key ? t.color : "transparent", color: sourceType === t.key ? "#fff" : "#888", boxShadow: sourceType === t.key ? "0 1px 4px rgba(0,0,0,0.15)" : "none" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        {reportData && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(130px,1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Tổng doanh thu", value: fmt(summary.revenue), color: SOURCE_TABS.find(s => s.key === sourceType)?.color || "#F4B400" },
              { label: "Đơn hàng", value: fmt(reportData.totalOrderRev), sub: `${reportData.totalOrderCount} đơn`, color: "#4CAF50" },
              { label: "Spa", value: fmt(reportData.totalSpaRev), sub: `${reportData.totalSpaCount} lịch`, color: "#42A5F5" },
              { label: "💵 Tiền mặt", value: fmt(reportData.pmSummary?.cashRevenue || 0), sub: `${reportData.pmSummary?.cashCount || 0} đơn`, color: "#2E7D32" },
              { label: "🏦 Chuyển khoản", value: fmt(reportData.pmSummary?.bankRevenue || 0), sub: `${reportData.pmSummary?.bankCount || 0} đơn`, color: "#1565C0" },
            ].map(s => (
              <div key={s.label} style={{ background: "#f9f9f9", borderRadius: 12, padding: "12px 14px", borderLeft: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 11, color: "#aaa" }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {reportLoading ? (
          <div style={{ height: isMobile ? 200 : 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>⏳ Đang tải...</div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            {sourceType === "all" ? (
              <BarChart data={getChartData()} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => v === 0 ? "0" : (v/1000000).toFixed(1)+"M"} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Legend />
                <Bar dataKey="Bán hàng" fill="#4CAF50" radius={[4,4,0,0]} stackId="a" />
                <Bar dataKey="Spa" fill="#42A5F5" radius={[4,4,0,0]} stackId="a" />
              </BarChart>
            ) : (
              <BarChart data={getChartData()} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => v === 0 ? "0" : (v/1000000).toFixed(1)+"M"} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Bar dataKey="revenue" fill={SOURCE_TABS.find(s => s.key === sourceType)?.color || "#F4B400"} radius={[6,6,0,0]}
                  name={sourceType === "order" ? "Bán hàng" : "Spa"} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* 7-day trend + Top products */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#222" }}>📈 Xu hướng 7 ngày gần đây</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => v === 0 ? "0" : (v/1000000).toFixed(1)+"M"} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Legend />
              <Line type="monotone" dataKey="orderRevenue" stroke="#4CAF50" strokeWidth={2} dot={{ r: 3 }} name="Bán hàng" />
              <Line type="monotone" dataKey="spaRevenue" stroke="#42A5F5" strokeWidth={2} dot={{ r: 3 }} name="Spa" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#222" }}>🏆 Top sản phẩm</div>
          {data.topProducts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "20px 0" }}>Chưa có dữ liệu</div>
          ) : data.topProducts.map((p: any, i: number) => (
            <div key={p.code} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: i===0?"#F4B400":i===1?"#C0C0C0":i===2?"#CD7F32":"#f0f0f0", display:"flex",alignItems:"center",justifyContent:"center", fontWeight:800,fontSize:11,color:i<3?"#fff":"#888",flexShrink:0 }}>{i+1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#888" }}>Bán: {p.sold} | {fmt(p.revenue)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low stock */}
      {data.lowStock.length > 0 && (
        <div style={{ background: "#FFF8E1", border: "1.5px solid #FFE082", borderRadius: 14, padding: "14px 18px" }}>
          <div style={{ fontWeight: 700, color: "#E65100", fontSize: 14, marginBottom: 8 }}>⚠️ Tồn kho thấp</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.lowStock.map((p: any) => (
              <span key={p.id} style={{ background: p.stock===0?"#FFEBEE":"#FFF3E0", color: p.stock===0?"#B71C1C":"#E65100", padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600 }}>
                {p.name} (còn {p.stock})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders + Spa today */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#222" }}>📋 Đơn hàng gần đây</div>
          {data.recentOrders.length === 0 ? (
            <div style={{ textAlign:"center",color:"#aaa",fontSize:13,padding:"20px 0" }}>Chưa có đơn hàng</div>
          ) : data.recentOrders.map((o: any) => {
            const s = STATUS_MAP[o.status] || { label: o.status, color:"#666", bg:"#f5f5f5" };
            return (
              <div key={o.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#f9f9f9",borderRadius:10,marginBottom:8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:"#F4B400" }}>{o.code}</div>
                  <div style={{ fontSize:12,color:"#666" }}>{o.customerName}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13,fontWeight:700 }}>{fmt(o.total)}</div>
                  <span style={{ background:s.bg,color:s.color,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600 }}>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#222" }}>✂️ Lịch spa hôm nay</div>
          {data.upcomingSpa.length === 0 ? (
            <div style={{ textAlign:"center",color:"#aaa",fontSize:13,padding:"20px 0" }}>Không có lịch spa hôm nay</div>
          ) : data.upcomingSpa.map((a: any) => {
            const s = SPA_STATUS[a.status] || { label:a.status,color:"#666",bg:"#f5f5f5" };
            const d = new Date(a.date);
            return (
              <div key={a.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#f9f9f9",borderRadius:10,marginBottom:8 }}>
                <div style={{ textAlign:"center",flexShrink:0,width:44 }}>
                  <div style={{ fontSize:13,fontWeight:800 }}>{d.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize:13,fontWeight:600 }}>{a.customerName}</div>
                  <div style={{ fontSize:11,color:"#F4B400" }}>🐾 {a.petName} · {a.serviceName}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13,fontWeight:700 }}>{fmt(a.price)}</div>
                  <span style={{ background:s.bg,color:s.color,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600 }}>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}