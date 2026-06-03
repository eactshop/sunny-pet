"use client";
import { useState, useEffect, useCallback } from "react";
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
      "Tổng": r.totalRevenue,
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { icon: "💰", label: "Tổng doanh thu", value: fmt(s.totalRevenue), color: "#F4B400" },
              { icon: "🛒", label: "Doanh thu bán hàng", value: fmt(s.totalOrderRev), sub: `${s.totalOrderCount} đơn`, color: "#4CAF50" },
              { icon: "✂️", label: "Doanh thu spa", value: fmt(s.totalSpaRev), sub: `${s.totalSpaCompleted}/${s.totalSpaCount} lịch`, color: "#42A5F5" },
              { icon: "✅", label: "Đơn hoàn thành", value: s.totalOrderCompleted, sub: `Tỷ lệ: ${s.conversionRate}%`, color: "#2E7D32" },
              { icon: "↩️", label: "Đơn hoàn trả", value: s.totalOrderReturned, color: "#FF7043" },
              { icon: "❌", label: "Đơn hủy", value: s.totalOrderCancelled, color: "#B71C1C" },
            ].map(c => (
              <div key={c.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", borderLeft: `4px solid ${c.color}`, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "#888" }}>{c.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: c.color }}>{c.value}</div>
                  {(c as any).sub && <div style={{ fontSize: 11, color: "#aaa" }}>{(c as any).sub}</div>}
                </div>
              </div>
            ))}
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
            <ResponsiveContainer width="100%" height={280}>
              {viewType === "all" ? (
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => v === 0 ? "0" : (v/1000000).toFixed(1)+"M"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Bán hàng" fill="#4CAF50" stackId="a" radius={[0,0,0,0]} />
                  <Bar dataKey="Spa" fill="#42A5F5" stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              ) : (
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => v === 0 ? "0" : (v/1000000).toFixed(1)+"M"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="revenue" fill={VIEW_TABS.find(t => t.key === viewType)?.color} radius={[6,6,0,0]}
                    name={viewType === "order" ? "Bán hàng" : "Spa"} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Top products + Top services */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
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
                      <Pie data={data.topServices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {data.topServices.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number, name: string) => [v + " lịch", name]} />
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