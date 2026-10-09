"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { assessments, documents, questions } from "@/db/schema";
import { generateAssessment } from "@/lib/ai/generate-assessment";
import { requireManager } from "@/lib/session";

export type GenerateState = { error?: string };

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_CONTENT_CHARS = 30_000;

const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters.")
  .max(160, "Title is too long.");

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
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }

  return new TextDecoder().decode(buffer);
}

function messageForFileError(error: unknown): string {
  if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
    return "The file is larger than 8 MB. Split it or paste the relevant section instead.";
  }
  if (error instanceof Error && error.message === "UNSUPPORTED_FILE") {
    return "Unsupported file type. Upload a PDF, TXT, or Markdown file.";
  }
  return "The document could not be read. Try pasting the text instead.";
}

export async function generateAssessmentAction(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const manager = await requireManager();

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
        "Provide a policy document with at least a few paragraphs (400+ characters).",
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

  let failed = false;
  try {
    const generated = await generateAssessment({
      title: parsedTitle.data,
      content: normalizedContent,
    });

    await db
      .update(assessments)
      .set({ title: generated.title })
      .where(eq(assessments.id, assessment.id));

    await db.insert(questions).values(
      generated.questions.map((question, index) => ({
        assessmentId: assessment.id,
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
  } catch {
    failed = true;
  }

  revalidatePath("/manager/documents");
  revalidatePath("/manager");
  redirect(
    failed
      ? `/manager/assessments/${assessment.id}?generation=failed`
      : `/manager/assessments/${assessment.id}`,
  );
}

export async function retryGenerationAction(formData: FormData) {
  const manager = await requireManager();

  const parsedId = z.uuid().safeParse(String(formData.get("assessmentId") ?? ""));
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

    await db
      .delete(questions)
      .where(eq(questions.assessmentId, assessment.id));
    await db
      .update(assessments)
      .set({ title: generated.title })
      .where(eq(assessments.id, assessment.id));
    await db.insert(questions).values(
      generated.questions.map((question, index) => ({
        assessmentId: assessment.id,
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
  } catch {
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
