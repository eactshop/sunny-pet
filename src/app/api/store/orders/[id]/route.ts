import { NextRequest, NextResponse } from "next/server";
import { getCustomerAuth } from "@/lib/customer-auth";
import { getOrderById } from "@/services/crm.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ success: false, error: "Không tìm thấy đơn hàng" }, { status: 404 });

    // Optionally verify ownership
    const auth = await getCustomerAuth();
    if (auth && order.customerId !== auth.customerId) {
      return NextResponse.json({ success: false, error: "Không có quyền truy cập" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
