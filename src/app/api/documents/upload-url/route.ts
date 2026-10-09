import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getDocumentUploadUrl, isStorageConfigured, sanitizeFileName } from "@/lib/storage";

const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(50 * 1024 * 1024),
  contentType: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Object storage is not configured." },
      { status: 503 },
    );
  }

  try {
    const json = await request.json();
    const parsed = uploadUrlSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid upload request parameters." },
        { status: 400 },
      );
    }

    const { fileName, fileSize } = parsed.data;
    const nameLower = fileName.toLowerCase();
    const contentType =
      parsed.data.contentType && parsed.data.contentType !== "application/octet-stream"
        ? parsed.data.contentType
        : nameLower.endsWith(".pdf")
          ? "application/pdf"
          : nameLower.endsWith(".md")
            ? "text/markdown"
            : "text/plain";

    const key = `documents/${crypto.randomUUID()}/${sanitizeFileName(fileName)}`;
    const uploadUrl = await getDocumentUploadUrl({ key, contentType });

    return NextResponse.json({
      uploadUrl,
      key,
      fileName,
      fileSize,
      contentType,
    });
  } catch (error) {
    console.error("[upload-url] failed to generate presigned url", error);
    return NextResponse.json(
      { error: "Could not create upload URL for object storage." },
      { status: 500 },
    );
  }
}
