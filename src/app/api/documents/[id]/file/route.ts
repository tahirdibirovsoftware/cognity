import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { getSession } from "@/lib/session";
import { getDocumentDownloadUrl } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const document = await getDb().query.documents.findFirst({
    where: eq(documents.id, parsed.data),
  });
  if (!document?.fileKey) {
    return NextResponse.json(
      { error: "No stored original for this document" },
      { status: 404 },
    );
  }

  try {
    const url = await getDocumentDownloadUrl(
      document.fileKey,
      document.fileName ?? document.title,
    );
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[documents] presigned download failed", error);
    return NextResponse.json(
      { error: "Object storage is not available" },
      { status: 503 },
    );
  }
}
