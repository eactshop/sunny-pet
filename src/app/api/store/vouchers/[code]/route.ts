import { NextRequest, NextResponse } from "next/server";
import { validateVoucher } from "@/services/crm.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(req.url);
    const orderTotal = Number(searchParams.get("total") || 0);

    const voucher = await validateVoucher(code.toUpperCase(), orderTotal);
    if (!voucher) {
      return NextResponse.json({ success: false, error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" }, { status: 404 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (voucher.type === "PERCENT") {
      discountAmount = (orderTotal * voucher.value) / 100;
      if (voucher.maxDiscount) discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    } else if (voucher.type === "FIXED") {
      discountAmount = voucher.value;
    }
    discountAmount = Math.min(discountAmount, orderTotal);

    return NextResponse.json({
      success: true,
      data: { ...voucher, discountAmount: Math.round(discountAmount) },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
