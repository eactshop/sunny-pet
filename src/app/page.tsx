import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import Providers from "@/components/store/Providers";
import { getProducts, getCategories } from "@/services/crm.service";
import Link from "next/link";
import { ChevronRight, Truck, Shield, RotateCcw, HeadphonesIcon } from "lucide-react";

const HERO_CATEGORIES = [
  { name: "Thức ăn chó", icon: "🐕", slug: "thuc-an-cho", color: "bg-yellow-50" },
  { name: "Thức ăn mèo", icon: "🐈", slug: "thuc-an-meo", color: "bg-orange-50" },
  { name: "Dầu gội", icon: "🛁", slug: "dau-goi", color: "bg-blue-50" },
  { name: "Xịt bọ chét", icon: "🌿", slug: "xit-bo-chet", color: "bg-green-50" },
  { name: "Phụ kiện", icon: "🎀", slug: "phu-kien", color: "bg-pink-50" },
];

export const revalidate = 60;

export default async function HomePage() {
  const [productsData, categories] = await Promise.all([
    getProducts({ limit: 8 }),
    getCategories(),
  ]);

  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          {/* Hero Banner */}
          <section className="bg-gradient-to-r from-[#F4B400] to-[#FFD54F] text-white">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                    Yêu thú cưng<br />
                    <span className="text-white/90">theo cách tốt nhất</span>
                  </h1>
                  <p className="text-lg text-yellow-100 mb-8 max-w-md">
                    Sản phẩm chất lượng cao cho thú cưng yêu của bạn. Giao hàng tận nơi, đổi trả dễ dàng.
                  </p>
                  <div className="flex gap-4 justify-center md:justify-start">
                    <Link
                      href="/san-pham"
                      className="bg-white text-[#F4B400] font-semibold px-8 py-3 rounded-full hover:bg-yellow-50 transition-colors shadow-lg"
                    >
                      Mua ngay
                    </Link>
                    <Link
                      href="/san-pham"
                      className="border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition-colors"
                    >
                      Xem sản phẩm
                    </Link>
                  </div>
                </div>
                <div className="text-8xl md:text-[10rem] select-none">🐾</div>
              </div>
            </div>
          </section>

          {/* Features bar */}
          <section className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { icon: <Truck className="w-5 h-5 text-[#F4B400]" />, text: "Miễn ship >300K" },
                  { icon: <Shield className="w-5 h-5 text-[#4CAF50]" />, text: "Hàng chính hãng" },
                  { icon: <RotateCcw className="w-5 h-5 text-blue-500" />, text: "Đổi trả 7 ngày" },
                  { icon: <HeadphonesIcon className="w-5 h-5 text-purple-500" />, text: "Hỗ trợ 24/7" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-600 justify-center md:justify-start">
                    {f.icon}
                    <span className="font-medium">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Danh mục sản phẩm</h2>
              <Link href="/san-pham" className="text-[#F4B400] hover:underline text-sm flex items-center gap-1">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {(categories.length > 0 ? categories : HERO_CATEGORIES).slice(0, 5).map((cat: any, i: number) => {
                const hero = HERO_CATEGORIES[i] || HERO_CATEGORIES[0];
                return (
                  <Link
                    key={cat.id || cat.slug}
                    href={`/san-pham?categoryId=${cat.id || ""}&slug=${cat.slug || ""}`}
                    className={`${hero.color} rounded-2xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-1 group`}
                  >
                    <div className="text-4xl mb-2">{hero.icon}</div>
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-[#F4B400]">{cat.name}</p>
                    {cat.productCount > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{cat.productCount} sản phẩm</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Featured Products */}
          <section className="max-w-7xl mx-auto px-4 pb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Sản phẩm nổi bật</h2>
                <p className="text-sm text-gray-500 mt-1">Được yêu thích nhất tại Sunny Pet</p>
              </div>
              <Link href="/san-pham" className="text-[#F4B400] hover:underline text-sm flex items-center gap-1">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {productsData.items.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-4">🐾</div>
                <p>Chưa có sản phẩm. Vui lòng thêm sản phẩm trong CRM.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                {productsData.items.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <Link
                href="/san-pham"
                className="inline-flex items-center gap-2 bg-[#F4B400] hover:bg-[#E5A800] text-white font-semibold px-10 py-3 rounded-full transition-colors shadow-md"
              >
                Xem tất cả sản phẩm <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Promo Banner */}
          <section className="bg-[#4CAF50] text-white py-12 px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-2xl font-bold mb-3">Đăng ký thành viên - Nhận ưu đãi ngay!</h3>
              <p className="text-green-100 mb-6">
                Tạo tài khoản để theo dõi đơn hàng, nhận thông báo khuyến mãi và tích lũy điểm thưởng.
              </p>
              <Link
                href="/tai-khoan"
                className="inline-block bg-white text-[#4CAF50] font-semibold px-8 py-3 rounded-full hover:bg-green-50 transition-colors shadow-lg"
              >
                Đăng ký ngay
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </Providers>
  );
}
