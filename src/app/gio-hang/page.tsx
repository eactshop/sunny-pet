"use client";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import Providers from "@/components/store/Providers";
import { useCartStore } from "@/store/cart.store";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";

function CartContent() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const total = totalPrice();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Giỏ hàng trống</h2>
        <p className="text-sm mb-6">Hãy thêm sản phẩm vào giỏ hàng của bạn</p>
        <Link
          href="/san-pham"
          className="bg-[#F4B400] hover:bg-[#E5A800] text-white font-semibold px-8 py-3 rounded-full transition-colors"
        >
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Giỏ hàng ({items.length} sản phẩm)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="bg-white rounded-2xl shadow-sm p-4 flex gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                }
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/san-pham/${item.productId}`} className="text-sm font-semibold text-gray-800 hover:text-[#F4B400] line-clamp-2">
                  {item.name}
                </Link>
                <p className="text-[#F4B400] font-bold mt-1">
                  {item.price.toLocaleString("vi-VN")}₫
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 hover:bg-gray-50 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-1.5 hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-700">
                      {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                    </span>
                    <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-4">Tóm tắt đơn hàng</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({items.length} sản phẩm)</span>
                <span className="font-medium">{total.toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className={total >= 300000 ? "text-green-600 font-medium" : "font-medium"}>
                  {total >= 300000 ? "Miễn phí" : "30.000₫"}
                </span>
              </div>
              {total < 300000 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                  Mua thêm {(300000 - total).toLocaleString("vi-VN")}₫ để được miễn phí vận chuyển
                </p>
              )}
              <hr />
              <div className="flex justify-between font-bold text-gray-800 text-base">
                <span>Tổng cộng</span>
                <span className="text-[#F4B400]">
                  {(total < 300000 ? total + 30000 : total).toLocaleString("vi-VN")}₫
                </span>
              </div>
            </div>

            <Link
              href="/thanh-toan"
              className="mt-6 flex items-center justify-center gap-2 w-full bg-[#F4B400] hover:bg-[#E5A800] text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Thanh toán <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/san-pham"
              className="mt-3 block text-center text-sm text-[#F4B400] hover:underline"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1"><CartContent /></main>
        <Footer />
      </div>
    </Providers>
  );
}
