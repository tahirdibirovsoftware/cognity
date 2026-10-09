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
import { requireManager, type SessionUser } from "@/lib/session";

export type GenerateState = { error?: string };

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_CONTENT_CHARS = 30_000;
const EXTRACTION_TIMEOUT_MS = 20_000;

const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters.")
  .max(160, "Title is too long.");

async function extractPdfText(buffer: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(buffer);
  const { text } = await Promise.race([
    extractText(pdf, { mergePages: true }),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("EXTRACTION_TIMEOUT")),
        EXTRACTION_TIMEOUT_MS,
      ),
    ),
  ]);
  return text;
}

async function readDocumentFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    throw new Error("UNSUPPORTED_FILE");
  }

  const buffer = new Uint8Array(await file.arrayBuffer());

  if (name.endsWith(".pdf")) {
    return extractPdfText(buffer);
  }

  return new TextDecoder().decode(buffer);
}

function messageForFileError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "FILE_TOO_LARGE") {
      return "The file is larger than 3 MB. Compress it or paste the relevant policy text instead.";
    }
    if (error.message === "UNSUPPORTED_FILE") {
      return "Unsupported file type. Upload a PDF, TXT, or Markdown file.";
    }
    if (error.message === "EXTRACTION_TIMEOUT") {
      return "This PDF took too long to read. Compress it or paste the policy text instead.";
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
  | { assessmentId: string; failed: boolean }
  | { error: string };

async function runGenerate(
  manager: SessionUser,
  formData: FormData,
): Promise<GenerateResult> {
  const parsedTitle = titleSchema.safeParse(String(formData.get("title") ?? ""));
  if (!parsedTitle.success) {
    return { error: parsedTitle.error.issues[0]?.message ?? "Invalid title." };
  }

  const pasted = String(formData.get("content") ?? "").trim();
  const fileEntry = formData.get("file");

  let content = pasted;
  if (fileEntry instanceof File && fileEntry.size > 0) {
    try {
      content = (await readDocumentFile(fileEntry)).trim();
    } catch (error) {
      return { error: messageForFileError(error) };
    }
  }

  if (content.length < 400) {
    return {
      error:
        "No usable text was found in this document. If it is a scanned PDF, paste the text instead.",
    };
  }

  const normalizedContent = content.slice(0, MAX_CONTENT_CHARS);
  const db = getDb();

  const [document] = await db
    .insert(documents)
    .values({
      title: parsedTitle.data,
      content: normalizedContent,
      uploadedById: manager.id,
    })
    .returning();

  const [assessment] = await db
    .insert(assessments)
    .values({
      documentId: document.id,
      title: parsedTitle.data,
      createdById: manager.id,
    })
    .returning();

  try {
    const generated = await generateAssessment({
      title: parsedTitle.data,
      content: normalizedContent,
    });
    await saveGeneratedQuestions(assessment.id, generated);
    return { assessmentId: assessment.id, failed: false };
  } catch (error) {
    console.error("[generateAssessment] AI generation failed", error);
    return { assessmentId: assessment.id, failed: true };
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
    console.error("[generateAssessment] unexpected failure", error);
    return {
      error:
        "Something went wrong while processing the document. Please try again or paste the text instead.",
    };
  }

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/manager/documents");
  revalidatePath("/manager");
  redirect(
    result.failed
      ? `/manager/assessments/${result.assessmentId}?generation=failed`
      : `/manager/assessments/${result.assessmentId}`,
  );
}

export async function retryGenerationAction(formData: FormData) {
  const manager = await requireManager();

  const parsedId = z
    .uuid()
    .safeParse(String(formData.get("assessmentId") ?? ""));
  if (!parsedId.success) return;

  const db = getDb();
  const assessment = await db.query.assessments.findFirst({
    where: eq(assessments.id, parsedId.data),
    with: { document: true },
  });
  if (!assessment || assessment.createdById !== manager.id) return;

  let failed = false;
  try {
    const generated = await generateAssessment({
      title: assessment.document.title,
      content: assessment.document.content,
    });
    await saveGeneratedQuestions(assessment.id, generated);
  } catch (error) {
    console.error("[retryGeneration] AI generation failed", error);
    failed = true;
  }

  revalidatePath(`/manager/assessments/${assessment.id}`);
  revalidatePath("/manager/documents");
  redirect(
    failed
      ? `/manager/assessments/${assessment.id}?generation=failed`
      : `/manager/assessments/${assessment.id}`,
  );
}
