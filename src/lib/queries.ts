import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  answers,
  assessments,
  assignments,
  attempts,
  documents,
  questions,
  users,
} from "@/db/schema";

export async function getManagerOverview() {
  const db = getDb();

  const [assignmentRows, questionCountRows, answerRows, publishedRows] =
    await Promise.all([
      db
        .select({
          assignmentId: assignments.id,
          assignmentStatus: assignments.status,
          employeeId: users.id,
          employeeName: users.name,
          employeeDepartment: users.department,
          assessmentId: assessments.id,
          assessmentTitle: assessments.title,
          attemptId: attempts.id,
          score: attempts.score,
          passed: attempts.passed,
          submittedAt: attempts.submittedAt,
        })
        .from(assignments)
        .innerJoin(users, eq(assignments.employeeId, users.id))
        .innerJoin(assessments, eq(assignments.assessmentId, assessments.id))
        .leftJoin(attempts, eq(attempts.assignmentId, assignments.id))
        .where(eq(assessments.status, "PUBLISHED"))
        .orderBy(sql`${attempts.submittedAt} desc nulls last`),
      db
        .select({ value: count() })
        .from(questions)
        .innerJoin(assessments, eq(questions.assessmentId, assessments.id))
        .where(eq(assessments.status, "PUBLISHED")),
      db
        .select({ confidence: answers.aiConfidence, type: questions.type })
        .from(answers)
        .innerJoin(questions, eq(answers.questionId, questions.id)),
      db
        .select({ value: count() })
        .from(assessments)
        .where(eq(assessments.status, "PUBLISHED")),
    ]);

  const totalAssignments = assignmentRows.length;
  const completed = assignmentRows.filter(
    (row) => row.assignmentStatus === "COMPLETED",
  );
  const pending = assignmentRows.filter(
    (row) => row.assignmentStatus === "PENDING",
  );
  const graded = assignmentRows.filter((row) => row.attemptId !== null);
  const passed = graded.filter((row) => row.passed === true);
  const averageScore =
    graded.length > 0
      ? Math.round(
          graded.reduce((sum, row) => sum + (row.score ?? 0), 0) / graded.length,
        )
      : 0;

  const openAnswersGraded = answerRows.filter(
    (row) => row.type === "SHORT_ANSWER",
  ).length;
  const highConfidence = answerRows.filter(
    (row) => row.confidence === "high",
  ).length;

  return {
    totalAssignments,
    completedCount: completed.length,
    pending,
    gradedCount: graded.length,
    passedCount: passed.length,
    averageScore,
    questionCount: questionCountRows[0]?.value ?? 0,
    publishedAssessmentCount: publishedRows[0]?.value ?? 0,
    openAnswersGraded,
    totalAnswers: answerRows.length,
    highConfidence,
    recent: graded.slice(0, 6),
  };
}

export async function getAssessmentsWithStats() {
  const db = getDb();

  const [rows, questionCounts, assignmentStats] = await Promise.all([
    db
      .select({
        id: assessments.id,
        title: assessments.title,
        status: assessments.status,
        passingScore: assessments.passingScore,
        createdAt: assessments.createdAt,
        publishedAt: assessments.publishedAt,
        documentTitle: documents.title,
      })
      .from(assessments)
      .innerJoin(documents, eq(assessments.documentId, documents.id))
      .orderBy(desc(assessments.createdAt)),
    db
      .select({ assessmentId: questions.assessmentId, value: count() })
      .from(questions)
      .groupBy(questions.assessmentId),
    db
      .select({
        assessmentId: assignments.assessmentId,
        total: count(),
        completed: count(assignments.completedAt),
        passed: count(attempts.passed),
      })
      .from(assignments)
      .leftJoin(attempts, eq(attempts.assignmentId, assignments.id))
      .groupBy(assignments.assessmentId),
  ]);

  const questionMap = new Map(
    questionCounts.map((row) => [row.assessmentId, row.value]),
  );
  const assignmentMap = new Map(
    assignmentStats.map((row) => [row.assessmentId, row]),
  );

  return rows.map((row) => {
    const stats = assignmentMap.get(row.id);
    return {
      ...row,
      questionCount: questionMap.get(row.id) ?? 0,
      assignedCount: stats?.total ?? 0,
      completedCount: stats?.completed ?? 0,
      passedCount: stats?.passed ?? 0,
    };
  });
}

export async function getAssessmentDetail(id: string) {
  const db = getDb();

  const assessment = await db.query.assessments.findFirst({
    where: eq(assessments.id, id),
    with: { document: true, createdBy: true },
  });
  if (!assessment) return null;

  const [questionRows, assignmentRows, employeeCountRows, allEmployees] =
    await Promise.all([
      db
        .select()
        .from(questions)
        .where(eq(questions.assessmentId, id))
        .orderBy(questions.position),
      db
        .select({
          id: assignments.id,
          status: assignments.status,
          dueAt: assignments.dueAt,
          completedAt: assignments.completedAt,
          employeeId: users.id,
          employeeName: users.name,
          employeeDepartment: users.department,
          attemptId: attempts.id,
          score: attempts.score,
          passed: attempts.passed,
          submittedAt: attempts.submittedAt,
        })
        .from(assignments)
        .innerJoin(users, eq(assignments.employeeId, users.id))
        .leftJoin(attempts, eq(attempts.assignmentId, assignments.id))
        .where(eq(assignments.assessmentId, id))
        .orderBy(users.name),
      db
        .select({ value: count() })
        .from(users)
        .where(eq(users.role, "EMPLOYEE")),
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          department: users.department,
        })
        .from(users)
        .where(eq(users.role, "EMPLOYEE"))
        .orderBy(users.name),
    ]);

  const assignedEmployeeIds = new Set(assignmentRows.map((a) => a.employeeId));
  const unassignedEmployees = allEmployees.filter(
    (e) => !assignedEmployeeIds.has(e.id),
  );

  return {
    assessment,
    questions: questionRows,
    assignments: assignmentRows,
    employeeCount: employeeCountRows[0]?.value ?? 0,
    unassignedEmployees,
  };
}

export async function getDocumentsWithAssessments() {
  return getDb().query.documents.findMany({
    with: {
      uploadedBy: { columns: { name: true } },
      assessments: {
        columns: { id: true, title: true, status: true, createdAt: true },
      },
    },
    orderBy: [desc(documents.createdAt)],
  });
}

export async function getEmployeeAssignments(employeeId: string) {
  return getDb()
    .select({
      id: assignments.id,
      status: assignments.status,
      dueAt: assignments.dueAt,
      completedAt: assignments.completedAt,
      createdAt: assignments.createdAt,
      assessmentId: assessments.id,
      assessmentTitle: assessments.title,
      passingScore: assessments.passingScore,
      attemptId: attempts.id,
      score: attempts.score,
      passed: attempts.passed,
      submittedAt: attempts.submittedAt,
    })
    .from(assignments)
    .innerJoin(assessments, eq(assignments.assessmentId, assessments.id))
    .leftJoin(attempts, eq(attempts.assignmentId, assignments.id))
    .where(eq(assignments.employeeId, employeeId))
    .orderBy(
      sql`case when ${assignments.status} = 'PENDING' then 0 else 1 end`,
      desc(assignments.createdAt),
    );
}

export async function getAssignmentForEmployee(
  assignmentId: string,
  employeeId: string,
) {
  const db = getDb();

  const assignment = await db.query.assignments.findFirst({
    where: and(
      eq(assignments.id, assignmentId),
      eq(assignments.employeeId, employeeId),
    ),
    with: { assessment: true, attempts: true },
  });
  if (!assignment) return null;

  const questionRows = await db
    .select()
    .from(questions)
    .where(eq(questions.assessmentId, assignment.assessmentId))
    .orderBy(questions.position);

  return { assignment, questions: questionRows };
}

export async function getAttemptDetail(attemptId: string) {
  return getDb().query.attempts.findFirst({
    where: eq(attempts.id, attemptId),
    with: {
      assignment: {
        with: { assessment: true, employee: true },
      },
      answers: { with: { question: true } },
    },
  });
}

export async function getEmployeesWithStats() {
  const db = getDb();

  const [allUsers, allAssignments, publishedAssessments] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        department: users.department,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.name),
    db
      .select({
        assignmentId: assignments.id,
        employeeId: assignments.employeeId,
        assessmentId: assessments.id,
        assessmentTitle: assessments.title,
        status: assignments.status,
        dueAt: assignments.dueAt,
        completedAt: assignments.completedAt,
        score: attempts.score,
        passed: attempts.passed,
        submittedAt: attempts.submittedAt,
      })
      .from(assignments)
      .innerJoin(assessments, eq(assignments.assessmentId, assessments.id))
      .leftJoin(attempts, eq(attempts.assignmentId, assignments.id))
      .orderBy(desc(assignments.createdAt)),
    db
      .select({
        id: assessments.id,
        title: assessments.title,
        passingScore: assessments.passingScore,
        documentTitle: documents.title,
      })
      .from(assessments)
      .innerJoin(documents, eq(assessments.documentId, documents.id))
      .where(eq(assessments.status, "PUBLISHED"))
      .orderBy(desc(assessments.createdAt)),
  ]);

  type AssignmentRecord = {
    assignmentId: string;
    employeeId: string;
    assessmentId: string;
    assessmentTitle: string;
    status: "PENDING" | "COMPLETED";
    dueAt: Date | null;
    completedAt: Date | null;
    score: number | null;
    passed: boolean | null;
    submittedAt: Date | null;
  };

  const assignmentsByEmployee = new Map<string, AssignmentRecord[]>();

  for (const assignment of allAssignments) {
    const list = assignmentsByEmployee.get(assignment.employeeId) ?? [];
    list.push(assignment);
    assignmentsByEmployee.set(assignment.employeeId, list);
  }

  const employees = allUsers.map((user) => {
    const userAssignments = assignmentsByEmployee.get(user.id) ?? [];
    const pending = userAssignments.filter((a) => a.status === "PENDING");
    const completed = userAssignments.filter((a) => a.status === "COMPLETED");
    const passed = completed.filter((a) => a.passed === true);
    const graded = completed.filter((a) => a.score !== null);
    const avgScore =
      graded.length > 0
        ? Math.round(
            graded.reduce((acc, a) => acc + (a.score ?? 0), 0) / graded.length,
          )
        : null;

    const assignedAssessmentIds = Array.from(
      new Set(userAssignments.map((a) => a.assessmentId)),
    );

    return {
      ...user,
      totalAssigned: userAssignments.length,
      pendingCount: pending.length,
      completedCount: completed.length,
      passedCount: passed.length,
      averageScore: avgScore,
      assignments: userAssignments,
      assignedAssessmentIds,
    };
  });

  const employeeOnly = employees.filter((e) => e.role === "EMPLOYEE");

  return {
    employees,
    publishedAssessments,
    totalEmployees: employeeOnly.length,
    totalManagers: employees.filter((e) => e.role === "MANAGER").length,
    pendingTrainingCount: employeeOnly.filter((e) => e.pendingCount > 0).length,
  };
}
