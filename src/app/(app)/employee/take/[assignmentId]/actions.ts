"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { answers, assignments, attempts, questions } from "@/db/schema";
import { gradeAnswers } from "@/lib/ai/grade-attempt";
import { requireEmployee } from "@/lib/session";

export type SubmitState = { error?: string };

function parseResponses(
  value: FormDataEntryValue | null,
): Record<string, string> | null {
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === "string") result[key] = val.slice(0, 4000);
    }
    return result;
  } catch {
    return null;
  }
}

export async function submitAttemptAction(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const employee = await requireEmployee();

  const parsedId = z
    .uuid()
    .safeParse(String(formData.get("assignmentId") ?? ""));
  if (!parsedId.success) return { error: "Invalid assignment." };

  const responses = parseResponses(formData.get("responses"));
  if (!responses) return { error: "Your answers could not be read. Try again." };

  const db = getDb();
  const assignment = await db.query.assignments.findFirst({
    where: and(
      eq(assignments.id, parsedId.data),
      eq(assignments.employeeId, employee.id),
    ),
    with: { assessment: true, attempts: true },
  });

  if (!assignment) return { error: "Assignment not found." };
  if (assignment.status === "COMPLETED" || assignment.attempts.length > 0) {
    return { error: "This assessment is already completed." };
  }

  const questionRows = await db
    .select()
    .from(questions)
    .where(eq(questions.assessmentId, assignment.assessmentId))
    .orderBy(questions.position);

  if (questionRows.length === 0) {
    return { error: "This assessment has no questions yet." };
  }

  const unanswered = questionRows.filter(
    (question) => !responses[question.id]?.trim(),
  );
  if (unanswered.length > 0) {
    return {
      error: `Answer all questions before submitting (${unanswered.length} remaining).`,
    };
  }

  const graded = await gradeAnswers(
    questionRows.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      correctAnswer: question.correctAnswer,
      rubric: question.rubric,
      points: question.points,
    })),
    responses,
  );

  const totalPoints = questionRows.reduce(
    (sum, question) => sum + question.points,
    0,
  );
  const earnedPoints = graded.reduce((sum, grade) => sum + grade.score, 0);
  const score =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= assignment.assessment.passingScore;

  const [attempt] = await db
    .insert(attempts)
    .values({ assignmentId: assignment.id, score, passed })
    .returning();

  await db.insert(answers).values(
    graded.map((grade) => ({
      attemptId: attempt.id,
      questionId: grade.questionId,
      response: grade.response,
      aiScore: grade.score,
      aiFeedback: grade.feedback,
      aiConfidence: grade.confidence,
    })),
  );

  await db
    .update(assignments)
    .set({ status: "COMPLETED", completedAt: new Date() })
    .where(eq(assignments.id, assignment.id));

  revalidatePath("/employee");
  revalidatePath("/manager");
  redirect(`/results/${attempt.id}`);
}
