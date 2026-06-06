import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const CLOUDINARY_CONFIGURED =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your-cloud-name";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ success: false, error: "Không có file" }, { status: 400 });

    // Kiểm tra định dạng
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Chỉ hỗ trợ file ảnh" }, { status: 400 });
    }

    // Giới hạn 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Ảnh quá lớn (tối đa 5MB)" }, { status: 400 });
    }

    // Upload Cloudinary nếu đã cấu hình
    if (CLOUDINARY_CONFIGURED) {
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const bytes = await file.arrayBuffer();
      const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
      const result = await cloudinary.uploader.upload(base64, {
        folder: "sunny-pet/products",
        transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
      });
      return NextResponse.json({ success: true, url: result.secure_url });
    }

    // Fallback: lưu vào public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
