"use client";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import Providers from "@/components/store/Providers";
import { useCustomerAuthStore } from "@/store/customer-auth.store";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Package } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700" },
  SHIPPING: { label: "Đang giao", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  RETURNED: { label: "Đã trả hàng", color: "bg-orange-100 text-orange-700" },
  CANCELLED: { label: "Đã huỷ", color: "bg-red-100 text-red-700" },
};

function OrdersContent() {
  const { customer } = useCustomerAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", customer?.id],
    queryFn: () => fetch("/api/store/orders").then((r) => r.json()),
    enabled: !!customer,
  });

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-gray-600 font-medium mb-3">Vui lòng đăng nhập để xem đơn hàng</p>
        <Link href="/tai-khoan" className="bg-[#F4B400] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#E5A800] transition-colors">
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  const orders = data?.data || [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Package className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-gray-600 font-medium mb-3">Bạn chưa có đơn hàng nào</p>
        <Link href="/san-pham" className="bg-[#F4B400] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#E5A800] transition-colors">
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
      {orders.map((order: any) => {
        const status = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100 text-gray-700" };
        return (
          <Link
            key={order.id}
            href={`/tai-khoan/don-hang/${order.id}`}
            className="block bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-gray-800">{order.code}</span>
                <span className="text-xs text-gray-400 ml-3">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              {order.items?.length || 0} sản phẩm
              {order.deliveryName && <span className="ml-3 text-gray-400">→ {order.deliveryName}</span>}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#F4B400] text-base">
                {Number(order.total).toLocaleString("vi-VN")}₫
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#F4B400] transition-colors" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <div className="bg-white border-b px-4 py-6">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-gray-500">
              <Link href="/tai-khoan" className="hover:text-[#F4B400]">Tài khoản</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 font-medium">Đơn hàng của tôi</span>
            </div>
            <div className="max-w-7xl mx-auto mt-3">
              <h1 className="text-2xl font-bold text-gray-800">Đơn hàng của tôi</h1>
            </div>
          </div>
          <OrdersContent />
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
