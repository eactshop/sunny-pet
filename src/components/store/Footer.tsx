import Link from "next/link";
import { PawPrint, Phone, Mail, MapPin, Share2, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#F4B400] flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-xl">
                Sunny<span className="text-[#F4B400]">Pet</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Cửa hàng thú cưng uy tín, chất lượng cao. Chúng tôi yêu thú cưng của bạn như yêu của chính mình.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-[#F4B400] transition-colors">
                <Share2 className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#F4B400] transition-colors">
                <Heart className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white font-semibold mb-4">Danh mục</h4>
            <ul className="space-y-2 text-sm">
              {[
                ["Thức ăn chó", "thuc-an-cho"],
                ["Thức ăn mèo", "thuc-an-meo"],
                ["Dầu gội thú cưng", "dau-goi"],
                ["Xịt bọ chét", "xit-bo-chet"],
                ["Phụ kiện", "phu-kien"],
              ].map(([name, slug]) => (
                <li key={slug}>
                  <Link href={`/san-pham?slug=${slug}`} className="hover:text-[#F4B400] transition-colors">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/san-pham" className="hover:text-[#F4B400] transition-colors">Tất cả sản phẩm</Link></li>
              <li><Link href="/tai-khoan/don-hang" className="hover:text-[#F4B400] transition-colors">Tra cứu đơn hàng</Link></li>
              <li><Link href="/tai-khoan" className="hover:text-[#F4B400] transition-colors">Tài khoản của tôi</Link></li>
              <li><a href="#" className="hover:text-[#F4B400] transition-colors">Chính sách đổi trả</a></li>
              <li><a href="#" className="hover:text-[#F4B400] transition-colors">Chính sách bảo mật</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F4B400] shrink-0 mt-0.5" />
                <span>271 Ngõ Chợ Khâm Thiên</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F4B400] shrink-0" />
                <a href="tel:0828599626" className="hover:text-[#F4B400] transition-colors">0828.599.626</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F4B400] shrink-0" />
                <a href="mailto:sunypet@gmail.com" className="hover:text-[#F4B400] transition-colors">sunypet@gmail.com</a>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
              <p className="font-medium text-gray-300 mb-1">Giờ làm việc</p>
              <p>T2 - T7: 8:00 - 20:00</p>
              <p>CN: 9:00 - 18:00</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
          © 2025 SunnyPet. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
