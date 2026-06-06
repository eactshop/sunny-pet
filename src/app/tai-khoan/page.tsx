"use client";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import Providers from "@/components/store/Providers";
import { useCustomerAuthStore } from "@/store/customer-auth.store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { User, Loader2, ShoppingBag, LogOut, PawPrint } from "lucide-react";

const loginSchema = z.object({
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirmPassword: z.string(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  address: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

function AccountContent() {
  const { customer, setCustomer, logout } = useCustomerAuthStore();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  async function handleLogin(values: LoginForm) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/store/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer(data.data);
      } else {
        setError(data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(values: RegisterForm) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/store/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer(data.data);
      } else {
        setError(data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (customer) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-[#F4B400]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#F4B400]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Xin chào, {customer.name}!</h2>
          <p className="text-gray-500 text-sm mb-6">{customer.phone}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link
              href="/tai-khoan/don-hang"
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-[#F4B400]/5 hover:border-[#F4B400] border border-transparent transition-all"
            >
              <ShoppingBag className="w-6 h-6 text-[#F4B400]" />
              <span className="text-sm font-medium text-gray-700">Đơn hàng</span>
            </Link>
            <Link
              href="/san-pham"
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-[#4CAF50]/5 hover:border-[#4CAF50] border border-transparent transition-all"
            >
              <PawPrint className="w-6 h-6 text-[#4CAF50]" />
              <span className="text-sm font-medium text-gray-700">Mua sắm</span>
            </Link>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors
                ${tab === t ? "text-[#F4B400] border-b-2 border-[#F4B400]" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4">
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                <input
                  {...loginForm.register("phone")}
                  placeholder="0901234567"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                />
                {loginForm.formState.errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                <input
                  {...loginForm.register("password")}
                  type="password"
                  placeholder="••••••"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F4B400] hover:bg-[#E5A800] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đăng nhập"}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              {[
                { field: "name" as const, label: "Họ và tên *", placeholder: "Nguyễn Văn A", type: "text" },
                { field: "phone" as const, label: "Số điện thoại *", placeholder: "0901234567", type: "text" },
                { field: "email" as const, label: "Email (tùy chọn)", placeholder: "email@example.com", type: "email" },
                { field: "address" as const, label: "Địa chỉ (tùy chọn)", placeholder: "Địa chỉ giao hàng", type: "text" },
                { field: "password" as const, label: "Mật khẩu *", placeholder: "••••••", type: "password" },
                { field: "confirmPassword" as const, label: "Xác nhận mật khẩu *", placeholder: "••••••", type: "password" },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field}>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <input
                    {...registerForm.register(field)}
                    type={type}
                    placeholder={placeholder}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
                  />
                  {registerForm.formState.errors[field] && (
                    <p className="text-red-500 text-xs mt-1">
                      {registerForm.formState.errors[field]?.message as string}
                    </p>
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4CAF50] hover:bg-[#388E3C] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo tài khoản"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <div className="bg-white border-b px-4 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800">Tài khoản</h1>
            </div>
          </div>
          <AccountContent />
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
