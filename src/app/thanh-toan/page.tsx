"use client";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import Providers from "@/components/store/Providers";
import { useCartStore } from "@/store/cart.store";
import { useCustomerAuthStore } from "@/store/customer-auth.store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Tag, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import type { CheckoutForm } from "@/types/store";

const schema = z.object({
  name: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  address: z.string().min(10, "Vui lòng nhập địa chỉ đầy đủ"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER"]),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function CheckoutContent() {
  const { items, clearCart, totalPrice } = useCartStore();
  const { customer } = useCustomerAuthStore();
  const router = useRouter();

  const [voucher, setVoucher] = useState<any>(null);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [unavailableVouchers, setUnavailableVouchers] = useState<any[]>([]);
  const [showVoucherPanel, setShowVoucherPanel] = useState(false);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const subtotal = totalPrice();
  const shippingFee = subtotal >= 300000 ? 0 : 30000;
  const discount = voucher?.discountAmount || 0;
  const total = subtotal + shippingFee - discount;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "COD" },
  });

  useEffect(() => {
    if (customer) {
      setValue("name", customer.name);
      setValue("phone", customer.phone);
      if (customer.email) setValue("email", customer.email);
      if (customer.address) setValue("address", customer.address);
    }
  }, [customer, setValue]);

  async function fetchVouchers() {
    setVouchersLoading(true);
    try {
      const res = await fetch(`/api/store/vouchers?total=${subtotal}`);
      const data = await res.json();
      if (data.success) {
        setAvailableVouchers(data.data.available);
        setUnavailableVouchers(data.data.unavailable);
      }
    } finally {
      setVouchersLoading(false);
    }
  }

  function handleOpenVouchers() {
    setShowVoucherPanel(true);
    fetchVouchers();
  }

  function selectVoucher(v: any) {
    setVoucher(v);
    setShowVoucherPanel(false);
  }

  async function onSubmit(values: FormValues) {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
          subtotal,
          discount,
          total,
          promotionId: voucher?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.data);
        clearCart();
      } else {
        alert(data.error || "Đặt hàng thất bại. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-xl font-semibold text-gray-600 mb-4">Giỏ hàng trống</p>
        <Link href="/san-pham" className="bg-[#F4B400] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#E5A800]">
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-16 h-16 text-[#4CAF50] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h2>
        <p className="text-gray-500 mb-2">Mã đơn hàng: <span className="font-bold text-[#F4B400]">{orderSuccess.code}</span></p>
        <p className="text-gray-500 text-sm mb-8">
          Chúng tôi sẽ liên hệ xác nhận đơn hàng trong vòng 30 phút.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/tai-khoan/don-hang" className="bg-[#F4B400] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#E5A800] transition-colors">
            Xem đơn hàng
          </Link>
          <Link href="/san-pham" className="border-2 border-[#F4B400] text-[#F4B400] px-6 py-2.5 rounded-xl font-semibold hover:bg-[#F4B400]/5 transition-colors">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thanh toán</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Thông tin giao hàng</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Họ và tên *</label>
                <input {...register("name")} placeholder="Nguyễn Văn A" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400]" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Số điện thoại *</label>
                <input {...register("phone")} placeholder="0901234567" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400]" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Địa chỉ giao hàng *</label>
                <input {...register("address")} placeholder="Số nhà, đường, phường, quận, tỉnh/thành" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400]" />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Email (tuỳ chọn)</label>
                <input {...register("email")} type="email" placeholder="email@example.com" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400]" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Ghi chú đơn hàng</label>
                <textarea {...register("note")} placeholder="Ghi chú về đơn hàng (tùy chọn)" rows={2} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400] resize-none" />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Phương thức thanh toán</h3>
            <div className="space-y-3">
              {[
                { value: "COD", label: "Thanh toán khi nhận hàng (COD)", icon: "💵" },
                { value: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng", icon: "🏦" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-3 border-2 border-gray-100 rounded-xl cursor-pointer has-[:checked]:border-[#F4B400] has-[:checked]:bg-[#F4B400]/5 transition-all">
                  <input {...register("paymentMethod")} type="radio" value={opt.value} className="accent-[#F4B400]" />
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24 space-y-4">
            <h3 className="font-semibold text-gray-800">Đơn hàng ({items.length})</h3>

            {/* Cart items */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 text-xs">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🐾</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 line-clamp-1">{item.name}</p>
                    <p className="text-gray-500">x{item.quantity}</p>
                  </div>
                  <span className="font-medium text-gray-700 shrink-0">
                    {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                  </span>
                </div>
              ))}
            </div>

            {/* Voucher */}
            <div>
              {voucher ? (
                /* Đã chọn voucher */
                <div className="flex items-center justify-between bg-green-50 border-2 border-green-300 rounded-xl px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-800 tracking-wide">{voucher.code}</p>
                      <p className="text-xs text-green-600 font-medium">
                        Giảm <span className="font-bold text-green-700">{voucher.discountAmount.toLocaleString("vi-VN")}₫</span>
                        {voucher.type === "PERCENT" && ` (${voucher.value}%)`}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setVoucher(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Chưa chọn — nút mở panel */
                <button type="button" onClick={handleOpenVouchers}
                  className="w-full flex items-center justify-between px-3 py-3 border-2 border-dashed border-[#F4B400] rounded-xl hover:bg-[#F4B400]/5 transition-colors group">
                  <div className="flex items-center gap-2 text-[#F4B400]">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm font-semibold">Chọn mã giảm giá</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#F4B400]" />
                </button>
              )}

              {/* Panel chọn voucher */}
              {showVoucherPanel && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#F4B400]" /> Mã giảm giá của bạn
                      </h3>
                      <button type="button" onClick={() => setShowVoucherPanel(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-4 space-y-3">
                      {vouchersLoading ? (
                        <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Đang tải voucher...</span>
                        </div>
                      ) : (
                        <>
                          {/* Voucher khả dụng */}
                          {availableVouchers.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Có thể dùng ({availableVouchers.length})
                              </p>
                              <div className="space-y-2">
                                {availableVouchers.map((v) => (
                                  <button key={v.id} type="button" onClick={() => selectVoucher(v)}
                                    className="w-full flex items-stretch gap-0 border-2 border-[#F4B400] rounded-xl overflow-hidden hover:shadow-md transition-all text-left group">
                                    {/* Left stripe */}
                                    <div className="w-2 bg-[#F4B400] shrink-0" />
                                    {/* Content */}
                                    <div className="flex-1 px-3 py-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <span className="font-black text-[#F4B400] tracking-widest text-sm">{v.code}</span>
                                          <p className="text-xs text-gray-600 mt-0.5">{v.name}</p>
                                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                                            {v.minOrder > 0 && <span>🛒 Đơn từ {Number(v.minOrder).toLocaleString("vi-VN")}₫</span>}
                                            <span>📅 HSD: {new Date(v.endDate).toLocaleDateString("vi-VN")}</span>
                                            {v.maxUses && <span>🎫 Còn {v.maxUses - v.usedCount} lượt</span>}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className="text-base font-black text-[#F4B400]">
                                            -{v.type === "PERCENT" ? `${v.value}%` : `${Number(v.value).toLocaleString("vi-VN")}₫`}
                                          </p>
                                          <p className="text-xs text-green-600 font-semibold">
                                            Tiết kiệm {v.discountAmount.toLocaleString("vi-VN")}₫
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Check icon */}
                                    <div className="w-10 bg-[#F4B400]/10 flex items-center justify-center shrink-0 group-hover:bg-[#F4B400] transition-colors">
                                      <CheckCircle className="w-5 h-5 text-[#F4B400] group-hover:text-white transition-colors" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Voucher chưa đủ điều kiện */}
                          {unavailableVouchers.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-3">
                                Chưa đủ điều kiện ({unavailableVouchers.length})
                              </p>
                              <div className="space-y-2">
                                {unavailableVouchers.map((v) => (
                                  <div key={v.id}
                                    className="flex items-stretch gap-0 border-2 border-gray-200 rounded-xl overflow-hidden opacity-60">
                                    <div className="w-2 bg-gray-300 shrink-0" />
                                    <div className="flex-1 px-3 py-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <span className="font-black text-gray-400 tracking-widest text-sm">{v.code}</span>
                                          <p className="text-xs text-gray-500 mt-0.5">{v.name}</p>
                                          <p className="text-xs text-red-500 mt-1 font-medium">⚠️ {v.reason}</p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-400 shrink-0">
                                          -{v.type === "PERCENT" ? `${v.value}%` : `${Number(v.value).toLocaleString("vi-VN")}₫`}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {availableVouchers.length === 0 && unavailableVouchers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                              <Tag className="w-10 h-10 mb-3 opacity-30" />
                              <p className="text-sm">Không có voucher nào</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="p-4 border-t">
                      <button type="button" onClick={() => setShowVoucherPanel(false)}
                        className="w-full py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <hr />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span><span>{subtotal.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Vận chuyển</span>
                <span className={shippingFee === 0 ? "text-green-600" : ""}>
                  {shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString("vi-VN")}₫`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center bg-green-50 rounded-lg px-2 py-1.5 border border-green-200">
                  <div className="flex items-center gap-1 text-green-700">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="font-medium">{voucher?.code}</span>
                  </div>
                  <span className="font-bold text-green-700">-{discount.toLocaleString("vi-VN")}₫</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-bold text-gray-800 text-base">
                <span>Tổng cộng</span>
                <span className="text-[#F4B400] text-lg">{total.toLocaleString("vi-VN")}₫</span>
              </div>
              {discount > 0 && (
                <p className="text-xs text-green-600 text-right">
                  Bạn tiết kiệm được {discount.toLocaleString("vi-VN")}₫
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F4B400] hover:bg-[#E5A800] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
              ) : (
                "Đặt hàng"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1"><CheckoutContent /></main>
        <Footer />
      </div>
    </Providers>
  );
}
