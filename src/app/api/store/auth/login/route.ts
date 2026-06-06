import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, signCustomerToken, COOKIE_NAME } from "@/lib/customer-auth";
import { getCustomerByPhone } from "@/services/crm.service";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập số điện thoại và mật khẩu" }, { status: 400 });
    }

    const customer = await getCustomerByPhone(phone);
    if (!customer || !customer.passwordHash) {
      return NextResponse.json({ success: false, error: "Số điện thoại hoặc mật khẩu không đúng" }, { status: 401 });
    }

    const valid = await verifyPassword(password, customer.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Số điện thoại hoặc mật khẩu không đúng" }, { status: 401 });
    }

    const token = signCustomerToken({
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    });

    const res = NextResponse.json({
      success: true,
      data: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
    });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "strict" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
