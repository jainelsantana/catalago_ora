import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import { join, normalize } from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  if (!path || path.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const uploadDir = normalize(join(process.cwd(), "public", "uploads"));
  const filePath = normalize(join(uploadDir, ...path));

  if (!filePath.startsWith(uploadDir)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    await fs.access(filePath);
    const fileBuffer = await fs.readFile(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    const mimeType =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "png"
        ? "image/png"
        : ext === "webp"
        ? "image/webp"
        : ext === "svg"
        ? "image/svg+xml"
        : ext === "gif"
        ? "image/gif"
        : ext === "avif"
        ? "image/avif"
        : ext === "bmp"
        ? "image/bmp"
        : ext === "ico"
        ? "image/x-icon"
        : "application/octet-stream";

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
