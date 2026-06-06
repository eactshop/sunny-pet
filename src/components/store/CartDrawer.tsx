"use client";
import { X, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart.store";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCartStore();
  const total = totalPrice();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-[#F4B400] text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold">Giỏ hàng ({items.length})</span>
          </div>
          <button onClick={closeCart} className="hover:bg-[#E5A800] p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Giỏ hàng trống</p>
              <Link
                href="/san-pham"
                onClick={closeCart}
                className="mt-3 text-sm text-[#F4B400] hover:underline font-medium"
              >
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</p>
                  <p className="text-sm font-bold text-[#F4B400] mt-1">
                    {item.price.toLocaleString("vi-VN")}₫
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-7 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1 hover:bg-gray-100 transition-colors disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tạm tính:</span>
              <span className="font-bold text-lg text-gray-800">
                {total.toLocaleString("vi-VN")}₫
              </span>
            </div>
            <Link
              href="/thanh-toan"
              onClick={closeCart}
              className="block w-full bg-[#F4B400] hover:bg-[#E5A800] text-white text-center py-3 rounded-xl font-semibold transition-colors"
            >
              Thanh toán
            </Link>
            <Link
              href="/gio-hang"
              onClick={closeCart}
              className="block w-full border-2 border-[#F4B400] text-[#F4B400] text-center py-2.5 rounded-xl font-medium hover:bg-[#F4B400]/5 transition-colors text-sm"
            >
              Xem giỏ hàng
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
