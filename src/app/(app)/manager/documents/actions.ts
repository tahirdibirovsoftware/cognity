"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { assessments, documents, questions } from "@/db/schema";
import {
  generateAssessment,
  type GeneratedAssessment,
} from "@/lib/ai/generate-assessment";
import {
  getDocumentFileBuffer,
  isStorageConfigured,
  sanitizeFileName,
  uploadDocumentFile,
} from "@/lib/storage";
import { requireManager, type SessionUser } from "@/lib/session";

export type GenerateState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_CONTENT_CHARS = 30_000;
const EXTRACTION_TIMEOUT_MS = 60_000; // 60 seconds

function deriveTitle(rawTitle: string, file: File | null): string {
  const trimmed = rawTitle.trim();
  if (trimmed.length >= 3) return trimmed;
  if (file?.name) {
    const cleaned = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();
    if (cleaned.length >= 3) return cleaned;
  }
  return "Untitled Document";
}

async function extractPdfText(buffer: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(buffer);

  const maxPagesToScan = Math.min(pdf.numPages, 60);
  let accumulatedText = "";

  for (let i = 1; i <= maxPagesToScan; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? (item as { str: string }).str : ""))
        .join(" ");
      accumulatedText += pageText + "\n\n";
      if (accumulatedText.length >= MAX_CONTENT_CHARS * 2) {
        break;
      }
    } catch (pageError) {
      console.warn(`[unpdf] Failed to read page ${i}`, pageError);
    }
  }

  if (accumulatedText.trim().length > 0) {
    return accumulatedText.trim();
  }

  const res = await extractText(pdf, { mergePages: true });
  return typeof res.text === "string" ? res.text : "";
}

async function safeExtractPdfText(buffer: Uint8Array): Promise<string> {
  return await Promise.race([
    extractPdfText(buffer),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("EXTRACTION_TIMEOUT")),
        EXTRACTION_TIMEOUT_MS,
      ),
    ),
  ]);
}

type StoredFile = {
  key: string;
  name: string;
  size: number;
  mimeType: string;
};

async function processDocumentFile(
  file: File,
): Promise<{ text: string; stored: StoredFile | null }> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    throw new Error("UNSUPPORTED_FILE");
  }

  const buffer = new Uint8Array(await file.arrayBuffer());

  const mimeType =
    file.type && file.type !== "application/octet-stream"
      ? file.type
      : name.endsWith(".pdf")
        ? "application/pdf"
        : name.endsWith(".md")
          ? "text/markdown"
          : "text/plain";

  let stored: StoredFile | null = null;
  if (isStorageConfigured()) {
    try {
      const key = `documents/${crypto.randomUUID()}/${sanitizeFileName(file.name)}`;
      await uploadDocumentFile({
        key,
        body: buffer,
        contentType: mimeType,
        fileName: file.name,
      });
      stored = {
        key,
        name: file.name,
        size: file.size,
        mimeType,
      };
    } catch (error) {
      console.error("[storage] document upload failed", error);
      throw new Error("STORAGE_UPLOAD_FAILED");
    }
  }

  let text = "";
  try {
    text = name.endsWith(".pdf")
      ? await safeExtractPdfText(buffer.slice())
      : new TextDecoder().decode(buffer);
  } catch (error) {
    console.warn("[document] text extraction warning", error);
    text = "";
  }

  return { text, stored };
}

function messageForFileError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "FILE_TOO_LARGE") {
      return "The file is larger than 50 MB. Compress it or paste the relevant text instead.";
    }
    if (error.message === "UNSUPPORTED_FILE") {
      return "Unsupported file type. Upload a PDF, TXT, or Markdown file.";
    }
    if (error.message === "STORAGE_UPLOAD_FAILED") {
      return "Could not upload the file to object storage. Please verify storage settings.";
    }
    if (error.message === "EXTRACTION_TIMEOUT") {
      return "Reading this PDF took longer than 60 seconds. You can still store it or paste the text instead.";
    }
    if (
      error.name === "PasswordException" ||
      /password/i.test(error.message)
    ) {
      return "This PDF is password-protected. Remove the password and upload it again, or paste the text instead.";
    }
  }
  return "The document could not be read. It may be corrupted or scanned — try pasting the text instead.";
}

async function saveGeneratedQuestions(
  assessmentId: string,
  generated: GeneratedAssessment,
) {
  const db = getDb();
  await db.delete(questions).where(eq(questions.assessmentId, assessmentId));
  await db
    .update(assessments)
    .set({ title: generated.title })
    .where(eq(assessments.id, assessmentId));
  await db.insert(questions).values(
    generated.questions.map((question, index) => ({
      assessmentId,
      position: index + 1,
      type: question.type,
      prompt: question.prompt,
      options:
        question.type === "MULTIPLE_CHOICE" ? (question.options ?? null) : null,
      correctAnswer: question.correctAnswer,
      rubric: question.rubric,
      rationale: question.rationale,
      points: question.points,
    })),
  );
}

type GenerateResult =
  | { success: true; message: string; mode: "saved" }
  | { assessmentId: string; failed: boolean; reason?: string; mode: "generated" }
  | { error: string };

async function runGenerate(
  manager: SessionUser,
  formData: FormData,
): Promise<GenerateResult> {
  const fileEntry = formData.get("file");
  const hasFile = fileEntry instanceof File && fileEntry.size > 0;
  const presignedKey = String(formData.get("fileKey") ?? "").trim();
  const presignedName = String(formData.get("fileName") ?? "").trim();
  const presignedSize = Number(formData.get("fileSize") ?? 0);
  const presignedMime = String(formData.get("fileMimeType") ?? "").trim();
  const clientExtractedText = String(formData.get("extractedText") ?? "").trim();

  const rawTitle = String(formData.get("title") ?? "");
  const title = deriveTitle(
    rawTitle,
    presignedName ? { name: presignedName } as File : hasFile ? fileEntry : null,
  );

  const intent = String(formData.get("intent") ?? "generate");
  const pasted = String(formData.get("content") ?? "").trim();

  let content = pasted;
  let stored: StoredFile | null = null;

  if (presignedKey) {
    stored = {
      key: presignedKey,
      name: presignedName || "document.pdf",
      size: presignedSize,
      mimeType: presignedMime || "application/pdf",
    };
    if (clientExtractedText) {
      content = clientExtractedText;
    } else {
      try {
        const buffer = await getDocumentFileBuffer(presignedKey);
        content = presignedName.toLowerCase().endsWith(".pdf")
          ? await safeExtractPdfText(buffer)
          : new TextDecoder().decode(buffer);
        content = content.trim();
      } catch (err) {
        console.warn("[storage] could not fetch/extract text for presigned key", err);
        content = "";
      }
    }
  } else if (hasFile) {
    try {
      const processed = await processDocumentFile(fileEntry);
      content = processed.text.trim();
      stored = processed.stored;
    } catch (error) {
      return { error: messageForFileError(error) };
    }
  }

  if (!content && !stored) {
    return {
      error: "Please provide document text or select a file to upload.",
    };
  }

  const normalizedContent =
    content.length > 0
      ? content.slice(0, MAX_CONTENT_CHARS)
      : `[Document: ${title} (${stored?.name ?? "Uploaded file"})]`;

  const db = getDb();

  const [document] = await db
    .insert(documents)
    .values({
      title,
      content: normalizedContent,
      fileKey: stored?.key ?? null,
      fileName: stored?.name ?? null,
      fileSize: stored?.size ?? null,
      fileMimeType: stored?.mimeType ?? null,
      uploadedById: manager.id,
    })
    .returning();

  if (intent === "save_only") {
    return {
      success: true,
      message: `"${document.title}" was saved and stored in object storage.`,
      mode: "saved",
    };
  }

  if (content.length < 50) {
    return {
      error:
        "The document was saved, but not enough text could be extracted to generate questions automatically. Scanned PDFs need selectable text, or you can paste the text manually.",
    };
  }

  const [assessment] = await db
    .insert(assessments)
    .values({
      documentId: document.id,
      title,
      createdById: manager.id,
    })
    .returning();

  try {
    const generated = await generateAssessment({
      title,
      content: normalizedContent,
    });
    await saveGeneratedQuestions(assessment.id, generated);
    return { assessmentId: assessment.id, failed: false, mode: "generated" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("[generateAssessment] AI generation failed", error);
    return { assessmentId: assessment.id, failed: true, reason, mode: "generated" };
  }
}

export async function generateAssessmentAction(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const manager = await requireManager();

  let result: GenerateResult;
  try {
    result = await runGenerate(manager, formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[generateAssessment] unexpected failure", error);
    return {
      error: `Could not process document: ${message}`,
    };
  }

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/manager/documents");
  revalidatePath("/manager");

  if (result.mode === "saved") {
    return { success: true, message: result.message };
  }

  const querySuffix = result.failed
    ? `?generation=failed${"reason" in result && result.reason ? `&reason=${encodeURIComponent(result.reason.slice(0, 200))}` : ""}`
    : "";

  redirect(`/manager/assessments/${result.assessmentId}${querySuffix}`);
}

export async function retryGenerationAction(formData: FormData) {
  await requireManager();

  const parsedId = z
    .uuid()
    .safeParse(String(formData.get("assessmentId") ?? ""));
  if (!parsedId.success) return;

  const db = getDb();
  const assessment = await db.query.assessments.findFirst({
    where: eq(assessments.id, parsedId.data),
    with: { document: true },
  });
  if (!assessment) return;

  let failed = false;
  let reason = "";
  try {
    const generated = await generateAssessment({
      title: assessment.document.title,
      content: assessment.document.content,
    });
    await saveGeneratedQuestions(assessment.id, generated);
  } catch (error) {
    console.error("[retryGeneration] AI generation failed", error);
    failed = true;
    reason = error instanceof Error ? error.message : String(error);
  }

  revalidatePath(`/manager/assessments/${assessment.id}`);
  revalidatePath("/manager/documents");
  redirect(
    failed
      ? `/manager/assessments/${assessment.id}?generation=failed${reason ? `&reason=${encodeURIComponent(reason.slice(0, 200))}` : ""}`
      : `/manager/assessments/${assessment.id}`,
  );
}

export async function generateFromDocumentAction(formData: FormData) {
  const manager = await requireManager();

  const parsedId = z
    .uuid()
    .safeParse(String(formData.get("documentId") ?? ""));
  if (!parsedId.success) return;

  const db = getDb();
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, parsedId.data),
  });
  if (!document) return;

  const [assessment] = await db
    .insert(assessments)
    .values({
      documentId: document.id,
      title: document.title,
      createdById: manager.id,
    })
    .returning();

  let failed = false;
  let reason = "";
  try {
    const generated = await generateAssessment({
      title: document.title,
      content: document.content,
    });
    await saveGeneratedQuestions(assessment.id, generated);
  } catch (error) {
    console.error("[generateFromDocument] AI generation failed", error);
    failed = true;
    reason = error instanceof Error ? error.message : String(error);
  }

  revalidatePath("/manager/documents");
  revalidatePath("/manager");
  redirect(
    failed
      ? `/manager/assessments/${assessment.id}?generation=failed${reason ? `&reason=${encodeURIComponent(reason.slice(0, 200))}` : ""}`
      : `/manager/assessments/${assessment.id}`,
  );
}
