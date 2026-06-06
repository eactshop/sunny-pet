"use client";
import { useState } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import type { StoreProduct } from "@/types/store";

export default function AddToCartButton({ product }: { product: StoreProduct }) {
  const [qty, setQty] = useState(1);
  const { addItem, openCart } = useCartStore();
  const isOutOfStock = product.stock <= 0;
  const price = product.salePrice && product.salePrice > 0 && product.salePrice < product.sellPrice
    ? product.salePrice
    : product.sellPrice;

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price,
      quantity: qty,
      stock: product.stock,
    });
    openCart();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Số lượng:</span>
        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-700"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm font-semibold min-w-[2.5rem] text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            disabled={qty >= product.stock}
            className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add to cart button */}
      <button
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all
          ${isOutOfStock
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-[#F4B400] hover:bg-[#E5A800] text-white hover:shadow-md"
          }`}
      >
        <ShoppingCart className="w-5 h-5" />
        {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
      </button>
    </div>
  );
}
