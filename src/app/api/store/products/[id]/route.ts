import { NextRequest, NextResponse } from "next/server";
import { getProductById, getProducts } from "@/services/crm.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }
    // Related products same category
    const related = await getProducts({ categoryId: product.categoryId, limit: 8 });
    const relatedFiltered = related.items.filter((p: any) => p.id !== id).slice(0, 6);
    return NextResponse.json({ success: true, data: { product, related: relatedFiltered } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
