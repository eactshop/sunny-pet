import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/services/crm.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await getProducts({
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 24),
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
