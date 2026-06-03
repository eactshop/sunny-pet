"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@sunnypet.vn");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
  setError(data.error || "Đăng nhập thất bại");
  return;
}

window.location.href = "/dashboard";
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Background circles */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(244,180,0,0.05)", top: -100, right: -100 }} />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(76,175,80,0.05)", bottom: -50, left: -50 }} />

      <div style={{
        background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, padding: "48px 40px", width: 420, position: "relative",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, #F4B400, #E65100)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(244,180,0,0.3)",
          }}>🐾</div>
          <div style={{ color: "#F4B400", fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>SUNNY PET</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>MANAGEMENT SYSTEM</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
              📧 Email
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)",
                borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
              🔒 Mật khẩu
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)",
                borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(183,28,28,0.2)", border: "1px solid rgba(183,28,28,0.4)",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
              color: "#ff6b6b", fontSize: 13, textAlign: "center",
            }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "rgba(244,180,0,0.5)" : "linear-gradient(135deg, #F4B400, #E65100)",
              border: "none", borderRadius: 12, color: "#fff",
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 20px rgba(244,180,0,0.3)",
              transition: "all 0.2s",
            }}>
            {loading ? "⏳ Đang đăng nhập..." : "🚀 Đăng nhập"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
            Quên mật khẩu? Liên hệ quản trị viên
          </span>
        </div>

        {/* Demo hint */}
        <div style={{
          marginTop: 24, padding: "12px 16px",
          background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.2)",
          borderRadius: 10, fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center",
        }}>
          Demo: admin@sunnypet.vn / admin123
        </div>
      </div>
    </div>
  );
}