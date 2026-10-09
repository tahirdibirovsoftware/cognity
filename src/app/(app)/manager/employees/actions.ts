"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { assignments, users } from "@/db/schema";
import {
  assignAssessmentSchema,
  createEmployeeSchema,
} from "@/lib/employee-schema";
import { requireManager } from "@/lib/session";

export type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function createEmployeeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireManager();

  const rawData = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    department: String(formData.get("department") ?? "").trim() || "General",
    password: String(formData.get("password") ?? "").trim() || "welcome123",
    role: String(formData.get("role") ?? "EMPLOYEE"),
    initialAssessmentId: String(formData.get("initialAssessmentId") ?? "").trim(),
  };

  const parsed = createEmployeeSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid employee information provided." };
  }

  const db = getDb();
  const existing = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (existing) {
    return {
      error: `An account with email "${parsed.data.email}" already exists.`,
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      department: parsed.data.department,
      role: parsed.data.role,
      passwordHash,
    })
    .returning();

  if (
    parsed.data.initialAssessmentId &&
    parsed.data.initialAssessmentId.length > 0 &&
    parsed.data.role === "EMPLOYEE"
  ) {
    const dueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await db
      .insert(assignments)
      .values({
        employeeId: newUser.id,
        assessmentId: parsed.data.initialAssessmentId,
        dueAt,
      })
      .onConflictDoNothing();
  }

  revalidatePath("/manager/employees");
  revalidatePath("/manager/assessments");
  revalidatePath("/manager");

  return {
    success: true,
    message: `Created account for ${newUser.name} (${newUser.email}). Initial password: "${parsed.data.password}". They can sign in at /login.`,
  };
}

export async function assignAssessmentToEmployeeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireManager();

  const parsed = assignAssessmentSchema.safeParse({
    employeeId: String(formData.get("employeeId") ?? ""),
    assessmentId: String(formData.get("assessmentId") ?? ""),
    dueDays: formData.get("dueDays") ? Number(formData.get("dueDays")) : 14,
  });

  if (!parsed.success) {
    return { error: "Please select an employee and an assessment." };
  }

  const db = getDb();
  const dueAt = new Date(Date.now() + parsed.data.dueDays * 24 * 60 * 60 * 1000);

  await db
    .insert(assignments)
    .values({
      employeeId: parsed.data.employeeId,
      assessmentId: parsed.data.assessmentId,
      dueAt,
    })
    .onConflictDoNothing();

  revalidatePath("/manager/employees");
  revalidatePath(`/manager/assessments/${parsed.data.assessmentId}`);
  revalidatePath("/manager/assessments");
  revalidatePath("/manager");

  return {
    success: true,
    message: "Assessment assigned successfully.",
  };
}

export async function deleteEmployeeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const manager = await requireManager();
  const targetId = String(formData.get("userId") ?? "");

  if (targetId === manager.id) {
    return { error: "You cannot delete your own account." };
  }

  const db = getDb();
  await db.delete(users).where(eq(users.id, targetId));

  revalidatePath("/manager/employees");
  revalidatePath("/manager/assessments");
  revalidatePath("/manager");

  return {
    success: true,
    message: "Account removed successfully.",
  };
}
