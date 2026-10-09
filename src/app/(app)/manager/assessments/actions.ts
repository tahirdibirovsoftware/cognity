"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { assessments, assignments, users } from "@/db/schema";
import { requireManager } from "@/lib/session";

async function loadAssessment(assessmentId: string) {
  const parsed = z.uuid().safeParse(assessmentId);
  if (!parsed.success) return null;

  const db = getDb();
  return db.query.assessments.findFirst({
    where: eq(assessments.id, parsed.data),
  });
}

export async function publishAssessmentAction(formData: FormData) {
  await requireManager();
  const assessment = await loadAssessment(
    String(formData.get("assessmentId") ?? ""),
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
  await requireManager();
  const assessment = await loadAssessment(
    String(formData.get("assessmentId") ?? ""),
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
  revalidatePath("/manager/employees");
  revalidatePath("/manager");
}

export async function assignToSingleEmployeeAction(formData: FormData) {
  await requireManager();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  const dueDays = Number(formData.get("dueDays") ?? 14);

  const assessment = await loadAssessment(assessmentId);
  if (!assessment || assessment.status !== "PUBLISHED") return;

  const parsedEmployee = z.uuid().safeParse(employeeId);
  if (!parsedEmployee.success) return;

  const db = getDb();
  const dueAt = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000);

  await db
    .insert(assignments)
    .values({
      assessmentId: assessment.id,
      employeeId: parsedEmployee.data,
      dueAt,
    })
    .onConflictDoNothing();

  revalidatePath(`/manager/assessments/${assessment.id}`);
  revalidatePath("/manager/assessments");
  revalidatePath("/manager/employees");
  revalidatePath("/manager");
}
