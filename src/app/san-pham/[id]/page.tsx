import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import Providers from "@/components/store/Providers";
import AddToCartButton from "@/components/store/AddToCartButton";
import { getProductById, getProducts } from "@/services/crm.service";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Package, Shield, Truck } from "lucide-react";

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, relatedData] = await Promise.all([
    getProductById(id),
    getProducts({ limit: 6 }),
  ]);

  if (!product) notFound();

  const related = relatedData.items
    .filter((p: any) => p.id !== id && p.categoryId === product.categoryId)
    .slice(0, 4);

  const isOutOfStock = product.stock <= 0;
  const salePrice = Number(product.salePrice);
  const sellPrice = Number(product.sellPrice);
  const hasDiscount = salePrice > 0 && salePrice < sellPrice;
  const displayPrice = hasDiscount ? salePrice : sellPrice;
  const discountPct = hasDiscount ? Math.round((1 - salePrice / sellPrice) * 100) : 0;

  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          {/* Breadcrumb */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#F4B400]">Trang chủ</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/san-pham" className="hover:text-[#F4B400]">Sản phẩm</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-800 font-medium line-clamp-1">{product.name}</span>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 flex items-center justify-center">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-8xl select-none">🐾</div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-700 text-sm font-semibold px-4 py-2 rounded-full">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6 md:p-8 flex flex-col">
                  <p className="text-sm text-[#4CAF50] font-medium mb-2">{product.categoryName}</p>
                  <h1 className="text-2xl font-bold text-gray-800 mb-3">{product.name}</h1>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-3xl font-bold text-[#F4B400]">
                        {displayPrice.toLocaleString("vi-VN")}₫
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-lg text-gray-400 line-through">
                            {sellPrice.toLocaleString("vi-VN")}₫
                          </span>
                          <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
                            -{discountPct}%
                          </span>
                        </>
                      )}
                    </div>
                    {hasDiscount && (
                      <p className="text-sm text-red-500 font-medium mt-1">
                        Tiết kiệm {(sellPrice - displayPrice).toLocaleString("vi-VN")}₫
                      </p>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-2 mb-6 text-sm">
                    <Package className="w-4 h-4 text-gray-400" />
                    {product.stock > 0 ? (
                      <span className={product.stock <= 5 ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                        {product.stock <= 5 ? `Chỉ còn ${product.stock} sản phẩm` : `Còn hàng (${product.stock})`}
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium">Hết hàng</span>
                    )}
                  </div>

                  {/* Add to cart */}
                  <AddToCartButton product={product} />

                  {/* Features */}
                  <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-3">
                    {[
                      { icon: <Truck className="w-4 h-4 text-[#F4B400]" />, text: "Miễn ship >300K" },
                      { icon: <Shield className="w-4 h-4 text-[#4CAF50]" />, text: "Hàng chính hãng" },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                        {f.icon} {f.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="px-6 md:px-8 pb-8 border-t mt-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 pt-6">Mô tả sản phẩm</h2>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </div>
                </div>
              )}
            </div>

            {/* Related products */}
            {related.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold text-gray-800 mb-5">Sản phẩm tương tự</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {related.map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
