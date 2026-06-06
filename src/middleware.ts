import { NextRequest, NextResponse } from "next/server";

const STORE_PUBLIC_PATHS = ["/", "/san-pham", "/gio-hang", "/thanh-toan", "/tai-khoan"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Public store routes
  if (
    pathname === "/" ||
    pathname.startsWith("/san-pham") ||
    pathname.startsWith("/gio-hang") ||
    pathname.startsWith("/thanh-toan") ||
    pathname.startsWith("/tai-khoan")
  ) {
    return NextResponse.next();
  }

  // CRM login page
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Dashboard and other CRM routes require admin auth
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
