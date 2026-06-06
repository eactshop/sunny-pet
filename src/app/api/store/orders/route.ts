import { NextRequest, NextResponse } from "next/server";
import { getCustomerAuth } from "@/lib/customer-auth";
import { createOrder, getOrdersByCustomer, getCustomerByPhone, createCustomer } from "@/services/crm.service";

// GET /api/store/orders - list orders for logged-in customer
export async function GET() {
  try {
    const auth = await getCustomerAuth();
    if (!auth) return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });

    const orders = await getOrdersByCustomer(auth.customerId);
    return NextResponse.json({ success: true, data: orders });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST /api/store/orders - create new order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, address, email, paymentMethod, note, items, subtotal, discount, total, promotionId } = body;

    if (!name || !phone || !address || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Thiếu thông tin đơn hàng" }, { status: 400 });
    }

    // Get or create customer
    let customer = await getCustomerByPhone(phone);
    if (!customer) {
      customer = await createCustomer({ name, phone, email, address });
    }

    const order = await createOrder({
      customerId: customer.id,
      items,
      subtotal: Number(subtotal),
      discount: Number(discount || 0),
      total: Number(total),
      note,
      promotionId,
      paymentMethod: paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "CASH",
      deliveryName: name,
      deliveryPhone: phone,
      deliveryAddress: address,
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
