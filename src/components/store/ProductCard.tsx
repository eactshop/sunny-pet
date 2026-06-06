"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import type { StoreProduct } from "@/types/store";

interface Props {
  product: StoreProduct;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();

  const salePrice = Number(product.salePrice);
  const sellPrice = Number(product.sellPrice);
  const hasDiscount = salePrice > 0 && salePrice < sellPrice;
  const displayPrice = hasDiscount ? salePrice : sellPrice;
  const discountPct = hasDiscount ? Math.round((1 - salePrice / sellPrice) * 100) : 0;
  const isOutOfStock = product.stock <= 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: displayPrice,
      quantity: 1,
      stock: product.stock,
    });
  }

  return (
    <Link href={`/san-pham/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-[#F4B400]/30">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl select-none">
              🐾
            </div>
          )}

          {/* Badge giảm giá - góc trên trái */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-md">
              -{discountPct}%
            </div>
          )}

          {/* Badge sắp hết - góc trên trái (khi không có giảm giá) */}
          {!hasDiscount && product.stock > 0 && product.stock <= 5 && (
            <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              Sắp hết
            </div>
          )}

          {/* Overlay hết hàng */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                Hết hàng
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-[#4CAF50] font-medium mb-1 truncate">{product.categoryName}</p>
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-[#F4B400] transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Giá */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              {/* Giá hiện tại (đậm) */}
              <span className="text-base font-bold text-[#F4B400] leading-tight">
                {displayPrice.toLocaleString("vi-VN")}₫
              </span>
              {/* Giá gốc gạch ngang */}
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through leading-tight">
                  {sellPrice.toLocaleString("vi-VN")}₫
                </span>
              )}
            </div>

            {/* Nút thêm giỏ */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0
                ${isOutOfStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#F4B400] text-white hover:bg-[#E5A800] hover:scale-110 shadow-sm"
                }`}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
