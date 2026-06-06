"use client";
import Link from "next/link";
import { ShoppingCart, User, Search, Menu, X, PawPrint } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart.store";
import { useCustomerAuthStore } from "@/store/customer-auth.store";
import { useRouter } from "next/navigation";
import CartDrawer from "./CartDrawer";

const categories = [
  { name: "Thức ăn chó", slug: "thuc-an-cho" },
  { name: "Thức ăn mèo", slug: "thuc-an-meo" },
  { name: "Dầu gội", slug: "dau-goi" },
  { name: "Xịt bọ chét", slug: "xit-bo-chet" },
  { name: "Phụ kiện", slug: "phu-kien" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { items, openCart } = useCartStore();
  const { customer, logout, refreshCustomer } = useCustomerAuthStore();
  const router = useRouter();
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    refreshCustomer();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/san-pham?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        {/* Top bar */}
        <div className="bg-[#F4B400] text-white text-xs py-1 text-center">
          Miễn phí vận chuyển đơn hàng trên 300.000đ &nbsp;|&nbsp; Hotline: 1800-SUNNY
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#F4B400] flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-800 hidden sm:block">
              Sunny<span className="text-[#F4B400]">Pet</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
            <div className="flex border-2 border-[#F4B400] rounded-full overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="flex-1 px-4 py-2 text-sm outline-none bg-white"
              />
              <button
                type="submit"
                className="px-4 bg-[#F4B400] text-white hover:bg-[#E5A800] transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Account */}
            {customer ? (
              <div className="relative group hidden sm:block">
                <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-[#F4B400]">
                  <User className="w-5 h-5" />
                  <span className="max-w-[80px] truncate">{customer.name}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/tai-khoan/don-hang" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#F4B400]">
                    Đơn hàng của tôi
                  </Link>
                  <Link href="/tai-khoan" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#F4B400]">
                    Tài khoản
                  </Link>
                  <hr className="my-1" />
                  <button onClick={() => logout()} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/tai-khoan" className="hidden sm:flex items-center gap-1 text-sm text-gray-700 hover:text-[#F4B400]">
                <User className="w-5 h-5" />
                <span>Đăng nhập</span>
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-1 text-gray-700 hover:text-[#F4B400] transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#F4B400] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-700 hover:text-[#F4B400]"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Category nav - desktop */}
        <nav className="hidden md:block border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex items-center gap-6 py-2 text-sm font-medium">
              <li>
                <Link href="/san-pham" className="text-gray-700 hover:text-[#F4B400] transition-colors">
                  Tất cả sản phẩm
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/san-pham?slug=${cat.slug}`}
                    className="text-gray-700 hover:text-[#F4B400] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white pb-4 px-4">
            <ul className="space-y-2 py-2 text-sm">
              <li><Link href="/san-pham" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 hover:text-[#F4B400]">Tất cả sản phẩm</Link></li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/san-pham?slug=${cat.slug}`} onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 hover:text-[#F4B400]">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t">
                {customer ? (
                  <>
                    <Link href="/tai-khoan/don-hang" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700">Đơn hàng của tôi</Link>
                    <button onClick={() => { logout(); setMenuOpen(false); }} className="block py-2 text-red-500 w-full text-left">Đăng xuất</button>
                  </>
                ) : (
                  <Link href="/tai-khoan" onClick={() => setMenuOpen(false)} className="block py-2 text-[#F4B400] font-medium">Đăng nhập / Đăng ký</Link>
                )}
              </li>
            </ul>
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  );
}
