"use client";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

const PIE_COLORS = ["#F4B400", "#4CAF50", "#42A5F5", "#FF7043", "#AB47BC", "#26A69A"];

const GROUP_TABS = [
  { key: "day",   label: "Theo ngày" },
  { key: "month", label: "Theo tháng" },
  { key: "year",  label: "Theo năm" },
];

const VIEW_TABS = [
  { key: "all",   label: "Tổng hợp",  color: "#F4B400" },
  { key: "order", label: "Bán hàng",  color: "#4CAF50" },
  { key: "spa",   label: "Spa",       color: "#42A5F5" },
];

export default function ReportsPage() {
  const isMobile = useIsMobile();
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const defaultTo = now.toISOString().slice(0, 10);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [groupBy, setGroupBy] = useState("day");
  const [viewType, setViewType] = useState("all");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?from=${from}&to=${to}&groupBy=${groupBy}&_t=${Date.now()}`);
      const d = await res.json();
      if (d.success) setData(d.data);
    } finally { setLoading(false); }
  }, [from, to, groupBy]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const setQuickRange = (type: string) => {
    const n = new Date();
    if (type === "today") { setFrom(n.toISOString().slice(0,10)); setTo(n.toISOString().slice(0,10)); setGroupBy("day"); }
    else if (type === "week") { const d = new Date(n); d.setDate(d.getDate()-6); setFrom(d.toISOString().slice(0,10)); setTo(n.toISOString().slice(0,10)); setGroupBy("day"); }
    else if (type === "month") { setFrom(new Date(n.getFullYear(),n.getMonth(),1).toISOString().slice(0,10)); setTo(n.toISOString().slice(0,10)); setGroupBy("day"); }
    else if (type === "quarter") { const m = Math.floor(n.getMonth()/3)*3; setFrom(new Date(n.getFullYear(),m,1).toISOString().slice(0,10)); setTo(n.toISOString().slice(0,10)); setGroupBy("month"); }
    else if (type === "year") { setFrom(new Date(n.getFullYear(),0,1).toISOString().slice(0,10)); setTo(n.toISOString().slice(0,10)); setGroupBy("month"); }
  };

  const getChartData = () => {
    if (!data?.chartData) return [];
    return data.chartData.map((r: any) => ({
      label: r.label,
      "Bán hàng": r.orderRevenue,
      "Spa": r.spaRevenue,
      "Hoàn hàng": r.totalReturnedRevenue || 0,
      "Thực nhận": r.netRevenue || 0,
      "Tổng gộp": r.totalRevenue,
      revenue: viewType === "all" ? r.totalRevenue : viewType === "order" ? r.orderRevenue : r.spaRevenue,
    }));
  };

  const s = data?.summary;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>📊 Báo cáo & Thống kê</h1>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Quick range */}
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "today", label: "Hôm nay" },
              { key: "week",  label: "7 ngày" },
              { key: "month", label: "Tháng này" },
              { key: "quarter", label: "Quý này" },
              { key: "year",  label: "Năm này" },
            ].map(q => (
              <button key={q.key} onClick={() => setQuickRange(q.key)}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e8e8e8", background: "#fafafa", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#555" }}>
                {q.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#888" }}>Từ:</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ padding: "7px 10px", border: "1.5px solid #e8e8e8", borderRadius: 8, fontSize: 13, outline: "none" }} />
            <span style={{ fontSize: 13, color: "#888" }}>Đến:</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ padding: "7px 10px", border: "1.5px solid #e8e8e8", borderRadius: 8, fontSize: 13, outline: "none" }} />
          </div>
          {/* Group by */}
          <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 10, padding: 3 }}>
            {GROUP_TABS.map(t => (
              <button key={t.key} onClick={() => setGroupBy(t.key)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: groupBy === t.key ? "#fff" : "transparent", color: groupBy === t.key ? "#F4B400" : "#888", boxShadow: groupBy === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#888" }}>⏳ Đang tải báo cáo...</div>
      ) : !data ? (
        <div style={{ padding: 60, textAlign: "center", color: "#888" }}>❌ Lỗi tải dữ liệu</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit,minmax(155px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { icon: "💰", label: "Tổng doanh thu gộp", value: fmt(s.totalRevenue), sub: "Bao gồm spa", color: "#F4B400" },
              { icon: "🛒", label: "Doanh thu bán hàng", value: fmt(s.totalOrderRev), sub: `${s.totalOrderCompleted}/${s.totalOrderCount} đơn`, color: "#4CAF50" },
              { icon: "✂️", label: "Doanh thu spa", value: fmt(s.totalSpaRev), sub: `${s.totalSpaCompleted}/${s.totalSpaCount} lịch`, color: "#42A5F5" },
              { icon: "↩️", label: "Doanh thu hoàn hàng", value: fmt(s.totalReturnedRev || 0), sub: `${s.totalOrderReturned} đơn hoàn`, color: "#FF7043" },
              { icon: "❌", label: "Doanh thu đơn hủy", value: fmt(s.totalCancelledRev || 0), sub: `${s.totalOrderCancelled} đơn hủy`, color: "#EF5350" },
              { icon: "✅", label: "Doanh thu thực (NET)", value: fmt(s.totalNetRev || 0), sub: `Sau trừ hoàn hàng`, color: "#2E7D32", highlight: true },
              { icon: "💎", label: "Lợi nhuận", value: fmt(s.totalProfit || 0), sub: `Biên LN ${s.profitMargin || 0}% · Vốn ${fmt(s.totalCostOfGoods || 0)}`, color: "#7B1FA2", highlight: true },
            ].map(c => (
              <div key={c.label} style={{ background: (c as any).highlight ? "#E8F5E9" : "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderLeft: `4px solid ${c.color}`, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "#888" }}>{c.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: c.color }}>{c.value}</div>
                  {(c as any).sub && <div style={{ fontSize: 11, color: "#aaa" }}>{(c as any).sub}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Net revenue breakdown bar */}
          {s.totalRevenue > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#222", marginBottom: 12 }}>📊 Phân tích doanh thu thực</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                {[
                  { label: "Doanh thu gộp", value: s.totalRevenue, color: "#F4B400" },
                  { label: "Hoàn hàng (-)", value: s.totalReturnedRev || 0, color: "#FF7043" },
                  { label: "Doanh thu thực", value: s.totalNetRev || 0, color: "#2E7D32" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                    <span style={{ fontSize: 12, color: "#666" }}>{item.label}:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 12, borderRadius: 8, background: "#f0f0f0", overflow: "hidden", display: "flex" }}>
                <div style={{ height: "100%", background: "#2E7D32", width: `${s.totalRevenue > 0 ? Math.round((s.totalNetRev || 0) / s.totalRevenue * 100) : 0}%`, transition: "width 0.5s", borderRadius: "8px 0 0 8px" }} />
                <div style={{ height: "100%", background: "#FF7043", width: `${s.totalRevenue > 0 ? Math.round((s.totalReturnedRev || 0) / s.totalRevenue * 100) : 0}%`, transition: "width 0.5s" }} />
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                Doanh thu thực = {s.totalRevenue > 0 ? Math.round((s.totalNetRev || 0) / s.totalRevenue * 100) : 0}% tổng doanh thu gộp
              </div>
            </div>
          )}

          {/* Payment method breakdown */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 14 }}>💳 Hình thức thanh toán</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#E8F5E9", borderRadius: 14, padding: "16px 18px", borderLeft: "4px solid #2E7D32" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>💵</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#2E7D32", fontWeight: 600 }}>Tiền mặt</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#2E7D32" }}>{fmt(s.cashRevenue || 0)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>{s.cashCount || 0} đơn hàng</div>
                <div style={{ marginTop: 8, height: 6, borderRadius: 4, background: "#f0f0f0", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: "#2E7D32", width: `${(s.totalOrderRev > 0 && s.cashRevenue) ? Math.round(s.cashRevenue / s.totalOrderRev * 100) : 0}%` }} />
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                  {(s.totalOrderRev > 0 && s.cashRevenue) ? Math.round(s.cashRevenue / s.totalOrderRev * 100) : 0}% tổng đơn hàng
                </div>
              </div>
              <div style={{ background: "#E3F2FD", borderRadius: 14, padding: "16px 18px", borderLeft: "4px solid #1565C0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>🏦</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#1565C0", fontWeight: 600 }}>Chuyển khoản</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#1565C0" }}>{fmt(s.bankRevenue || 0)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>{s.bankCount || 0} đơn hàng</div>
                <div style={{ marginTop: 8, height: 6, borderRadius: 4, background: "#f0f0f0", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: "#1565C0", width: `${(s.totalOrderRev > 0 && s.bankRevenue) ? Math.round(s.bankRevenue / s.totalOrderRev * 100) : 0}%` }} />
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                  {(s.totalOrderRev > 0 && s.bankRevenue) ? Math.round(s.bankRevenue / s.totalOrderRev * 100) : 0}% tổng đơn hàng
                </div>
              </div>
            </div>
          </div>

          {/* Revenue chart */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#222" }}>📈 Biểu đồ doanh thu</div>
              <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 10, padding: 3, gap: 2 }}>
                {VIEW_TABS.map(t => (
                  <button key={t.key} onClick={() => setViewType(t.key)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: viewType === t.key ? t.color : "transparent", color: viewType === t.key ? "#fff" : "#888" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {viewType === "all" ? (
                <BarChart data={getChartData()} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => v === 0 ? "0" : (v/1000000).toFixed(1)+"M"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="Bán hàng" fill="#4CAF50" stackId="rev" radius={[0,0,0,0]} />
                  <Bar dataKey="Spa" fill="#42A5F5" stackId="rev" radius={[0,0,0,0]} />
                  <Bar dataKey="Hoàn hàng" fill="#FF7043" stackId="ret" radius={[4,4,0,0]} />
                  <Line type="monotone" dataKey="Thực nhận" stroke="#2E7D32" strokeWidth={2.5} dot={{ r: 3 }} />
                </BarChart>
              ) : (
                <BarChart data={getChartData()} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => v === 0 ? "0" : (v/1000000).toFixed(1)+"M"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="revenue" fill={VIEW_TABS.find(t => t.key === viewType)?.color} radius={[6,6,0,0]}
                    name={viewType === "order" ? "Bán hàng" : "Spa"} />
                  {viewType === "order" && (
                    <Bar dataKey="Hoàn hàng" fill="#FF7043" radius={[4,4,0,0]} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Top products + Top services */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {/* Top products */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#222" }}>🏆 Top sản phẩm bán chạy</div>
              {data.topProducts.length === 0 ? (
                <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "20px 0" }}>Chưa có dữ liệu</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9" }}>
                      {["#", "Sản phẩm", "Đã bán", "Doanh thu"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "#888", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p: any, i: number) => (
                      <tr key={p.code} style={{ borderBottom: "1px solid #f5f5f5" }}>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: i===0?"#F4B400":i===1?"#C0C0C0":i===2?"#CD7F32":"#eee", display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:i<3?"#fff":"#888" }}>{i+1}</div>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "#888" }}>{p.categoryName}</div>
                        </td>
                        <td style={{ padding: "8px 10px", fontSize: 13, fontWeight: 700, color: "#4CAF50" }}>{p.sold}</td>
                        <td style={{ padding: "8px 10px", fontSize: 12, fontWeight: 600 }}>{fmt(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Top services */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#222" }}>✂️ Dịch vụ spa phổ biến</div>
              {data.topServices.length === 0 ? (
                <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "20px 0" }}>Chưa có dữ liệu</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data.topServices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${((percent || 0)*100).toFixed(0)}%`} labelLine={false}>
                        {data.topServices.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, name) => [Number(v) + " lịch", String(name)]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {data.topServices.map((s: any, i: number) => (
                      <div key={s.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span>{s.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <span style={{ color: "#42A5F5", fontWeight: 700 }}>{s.count} lịch</span>
                          <span style={{ color: "#4CAF50", fontWeight: 700 }}>{fmt(s.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top customers */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#222" }}>⭐ Khách hàng VIP trong kỳ</div>
            {data.topCustomers.length === 0 ? (
              <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "20px 0" }}>Chưa có dữ liệu</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9f9f9" }}>
                    {["#", "Khách hàng", "SĐT", "Đơn hàng", "Spa", "Tổng chi tiêu"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#888", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.map((c: any, i: number) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: i===0?"#F4B400":i===1?"#C0C0C0":i===2?"#CD7F32":"#eee", display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:i<3?"#fff":"#888" }}>{i+1}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#666" }}>{c.phone}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#4CAF50" }}>{c.orderCount} đơn</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{fmt(c.orderSpent)}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#42A5F5" }}>{c.spaCount} lịch</div>
                        <div style={{ fontSize: 11, color: "#888" }}>{fmt(c.spaSpent)}</div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 800, color: "#F4B400" }}>
                        {fmt(Number(c.orderSpent) + Number(c.spaSpent))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}