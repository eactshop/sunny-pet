import { NextRequest, NextResponse } from "next/server";
import { hashPassword, signCustomerToken, COOKIE_NAME } from "@/lib/customer-auth";
import { createCustomer, getCustomerByPhone, updateCustomerPassword } from "@/services/crm.service";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, password, email, address } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập đầy đủ thông tin" }, { status: 400 });
    }
    if (phone.length < 9) {
      return NextResponse.json({ success: false, error: "Số điện thoại không hợp lệ" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
    }

    const existing = await getCustomerByPhone(phone);
    if (existing) {
      if (existing.passwordHash) {
        return NextResponse.json({ success: false, error: "Số điện thoại đã được đăng ký" }, { status: 409 });
      }
      // CRM customer linking - set password
      const pwHash = await hashPassword(password);
      await updateCustomerPassword(existing.id, pwHash);
      const token = signCustomerToken({
        customerId: existing.id,
        name: existing.name,
        phone: existing.phone,
        email: existing.email,
      });
      const res = NextResponse.json({
        success: true,
        data: { id: existing.id, name: existing.name, phone: existing.phone, email: existing.email },
      });
      res.cookies.set(COOKIE_NAME, token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "strict" });
      return res;
    }

    const passwordHash = await hashPassword(password);
    const customer = await createCustomer({ name, phone, email, address, passwordHash });

    const token = signCustomerToken({
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    });

    const res = NextResponse.json({
      success: true,
      data: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
    }, { status: 201 });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "strict" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
