"use client";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import Providers from "@/components/store/Providers";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const categorySlug = searchParams.get("slug") || "";

  const { data: catData } = useQuery({
    queryKey: ["store-categories"],
    queryFn: () => fetch("/api/store/categories").then((r) => r.json()),
  });

  const categories = catData?.data || [];

  // Map slug to categoryId
  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const found = categories.find((c: any) => c.slug === categorySlug);
      if (found) setCategoryId(found.id);
    }
  }, [categorySlug, categories]);

  const { data, isLoading } = useQuery({
    queryKey: ["store-products", search, categoryId, sort, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "24",
        ...(search && { search }),
        ...(categoryId && { categoryId }),
      });
      return fetch(`/api/store/products?${params}`).then((r) => r.json());
    },
    staleTime: 30000,
  });

  const products = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;
  const total = data?.data?.total || 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filter */}
        <aside className="w-full md:w-56 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
            </h3>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Danh mục</label>
              <ul className="mt-2 space-y-1">
                <li>
                  <button
                    onClick={() => { setCategoryId(""); setPage(1); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!categoryId ? "bg-[#F4B400] text-white font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                  >
                    Tất cả
                  </button>
                </li>
                {categories.map((cat: any) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => { setCategoryId(cat.id); setPage(1); }}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${categoryId === cat.id ? "bg-[#F4B400] text-white font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      {cat.name}
                      {cat.productCount > 0 && (
                        <span className={`ml-1 text-xs ${categoryId === cat.id ? "text-yellow-100" : "text-gray-400"}`}>
                          ({cat.productCount})
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sắp xếp</label>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="flex-1 flex border-2 border-gray-200 focus-within:border-[#F4B400] rounded-xl overflow-hidden transition-colors">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="flex-1 px-4 py-2.5 text-sm outline-none"
              />
              <button type="submit" className="px-4 bg-[#F4B400] text-white hover:bg-[#E5A800] transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Result count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {isLoading ? "Đang tải..." : `Tìm thấy ${total} sản phẩm`}
            </p>
          </div>

          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-8 bg-gray-100 rounded mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg">Không tìm thấy sản phẩm</p>
              <button onClick={() => { setSearch(""); setCategoryId(""); setPage(1); }} className="mt-4 text-[#F4B400] hover:underline text-sm">
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:border-[#F4B400] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                      ${page === p ? "bg-[#F4B400] text-white" : "border border-gray-200 hover:border-[#F4B400] text-gray-700"}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:border-[#F4B400] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <div className="bg-white border-b px-4 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800">Tất cả sản phẩm</h1>
              <p className="text-gray-500 text-sm mt-1">Khám phá đầy đủ sản phẩm cho thú cưng của bạn</p>
            </div>
          </div>
          <ProductsContent />
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
