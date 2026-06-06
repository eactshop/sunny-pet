import { NextResponse } from "next/server";
import { getCustomerAuth } from "@/lib/customer-auth";
import { getCustomerById } from "@/services/crm.service";

export async function GET() {
  try {
    const auth = await getCustomerAuth();
    if (!auth) return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });

    const customer = await getCustomerById(auth.customerId);
    if (!customer) return NextResponse.json({ success: false, error: "Không tìm thấy tài khoản" }, { status: 404 });

    return NextResponse.json({ success: true, data: customer });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
