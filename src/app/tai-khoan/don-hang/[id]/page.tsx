"use client";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import Providers from "@/components/store/Providers";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronRight, Package, MapPin, Phone, User, CreditCard } from "lucide-react";
import { use } from "react";

const STATUS_STEPS = ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED"];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700" },
  SHIPPING: { label: "Đang giao hàng", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  RETURNED: { label: "Đã trả hàng", color: "bg-orange-100 text-orange-700" },
  CANCELLED: { label: "Đã huỷ", color: "bg-red-100 text-red-700" },
};

function OrderDetailContent({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetch(`/api/store/orders/${id}`).then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-6 h-24" />
        ))}
      </div>
    );
  }

  const order = data?.data;
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Package className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-gray-600">Không tìm thấy đơn hàng</p>
        <Link href="/tai-khoan/don-hang" className="mt-4 text-[#F4B400] hover:underline text-sm">
          Quay lại đơn hàng
        </Link>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100 text-gray-700" };
  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isNormalFlow = !["RETURNED", "CANCELLED"].includes(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{order.code}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Progress tracker */}
        {isNormalFlow && (
          <div className="relative mt-6">
            <div className="flex justify-between relative">
              {STATUS_STEPS.map((step, i) => {
                const stepStatus = STATUS_MAP[step];
                const done = currentStep >= i;
                const active = currentStep === i;
                return (
                  <div key={step} className="flex flex-col items-center z-10 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                      ${done ? "bg-[#4CAF50] border-[#4CAF50] text-white" : "bg-white border-gray-200 text-gray-400"}
                      ${active ? "ring-4 ring-[#4CAF50]/20" : ""}`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-xs mt-1.5 text-center leading-tight ${done ? "text-[#4CAF50] font-medium" : "text-gray-400"}`}>
                      {stepStatus?.label}
                    </p>
                  </div>
                );
              })}
              {/* connector */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0">
                <div
                  className="h-full bg-[#4CAF50] transition-all"
                  style={{ width: `${currentStep >= 0 ? (currentStep / (STATUS_STEPS.length - 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delivery info */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Thông tin giao hàng</h3>
        <div className="space-y-2.5 text-sm text-gray-600">
          {order.deliveryName && (
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />{order.deliveryName}</div>
          )}
          {order.deliveryPhone && (
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{order.deliveryPhone}</div>
          )}
          {order.deliveryAddress && (
            <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" />{order.deliveryAddress}</div>
          )}
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            {order.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản ngân hàng" : "Thanh toán khi nhận hàng (COD)"}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Sản phẩm ({order.items?.length})</h3>
        <div className="space-y-3">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                {item.productImage
                  ? <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.productName}</p>
                <p className="text-xs text-gray-400">{item.productCode} × {item.quantity}</p>
              </div>
              <span className="text-sm font-bold text-gray-700 shrink-0">
                {Number(item.subtotal).toLocaleString("vi-VN")}₫
              </span>
            </div>
          ))}
        </div>

        <hr className="my-4" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Tạm tính</span><span>{Number(order.subtotal).toLocaleString("vi-VN")}₫</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá</span><span>-{Number(order.discount).toLocaleString("vi-VN")}₫</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t">
            <span>Tổng cộng</span>
            <span className="text-[#F4B400]">{Number(order.total).toLocaleString("vi-VN")}₫</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <div className="bg-white border-b px-4 py-6">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-gray-500">
              <Link href="/tai-khoan" className="hover:text-[#F4B400]">Tài khoản</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/tai-khoan/don-hang" className="hover:text-[#F4B400]">Đơn hàng</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 font-medium">Chi tiết</span>
            </div>
            <div className="max-w-7xl mx-auto mt-3">
              <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h1>
            </div>
          </div>
          <OrderDetailContent id={id} />
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
