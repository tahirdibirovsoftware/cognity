"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { assessments, assignments, users } from "@/db/schema";
import { requireManager } from "@/lib/session";

async function loadOwnedAssessment(assessmentId: string, managerId: string) {
  const parsed = z.uuid().safeParse(assessmentId);
  if (!parsed.success) return null;

  const db = getDb();
  const assessment = await db.query.assessments.findFirst({
    where: eq(assessments.id, parsed.data),
  });
  if (!assessment || assessment.createdById !== managerId) return null;
  return assessment;
}

export async function publishAssessmentAction(formData: FormData) {
  const manager = await requireManager();
  const assessment = await loadOwnedAssessment(
    String(formData.get("assessmentId") ?? ""),
    manager.id,
  );
  if (!assessment) return;

  const db = getDb();
  await db
    .update(assessments)
    .set({ status: "PUBLISHED", publishedAt: new Date() })
    .where(eq(assessments.id, assessment.id));

  revalidatePath(`/manager/assessments/${assessment.id}`);
  revalidatePath("/manager/assessments");
  revalidatePath("/manager");
}

export async function assignToAllAction(formData: FormData) {
  const manager = await requireManager();
  const assessment = await loadOwnedAssessment(
    String(formData.get("assessmentId") ?? ""),
    manager.id,
  );
  if (!assessment || assessment.status !== "PUBLISHED") return;

  const db = getDb();
  const employees = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "EMPLOYEE"));

  if (employees.length === 0) return;

  const dueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await db
    .insert(assignments)
    .values(
      employees.map((employee) => ({
        assessmentId: assessment.id,
        employeeId: employee.id,
        dueAt,
      })),
    )
    .onConflictDoNothing();

  revalidatePath(`/manager/assessments/${assessment.id}`);
  revalidatePath("/manager/assessments");
  revalidatePath("/manager");
}
