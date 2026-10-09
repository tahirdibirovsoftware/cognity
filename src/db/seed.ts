import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { getDb } from "./index";
import {
  answers,
  assessments,
  assignments,
  attempts,
  documents,
  questions,
  users,
} from "./schema";
import { SAMPLE_POLICY, SAMPLE_POLICY_TITLE } from "../lib/sample-policy";

type QuestionSeed = {
  position: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  prompt: string;
  options: string[] | null;
  correctAnswer: string;
  rubric: string;
  rationale: string;
  points: number;
};

type WrittenGrade = {
  score: number;
  confidence: "high" | "medium" | "low";
  response: string;
  feedback: string;
};

type AttemptPlan = {
  email: string;
  daysAgo: number;
  objectiveCorrect: Record<number, boolean>;
  written: Record<number, WrittenGrade>;
};

const QUESTION_SEEDS: QuestionSeed[] = [
  {
    position: 1,
    type: "MULTIPLE_CHOICE",
    prompt: "How often must work passwords be rotated under the policy?",
    options: [
      "Every 30 days",
      "Every 60 days",
      "Every 90 days",
      "Only after a suspected breach",
    ],
    correctAnswer: "Every 90 days",
    rubric:
      "The answer must be 'Every 90 days' per Section 4 (Passwords and authentication).",
    rationale:
      "Password rotation is an explicit control in Section 4 and a common audit finding when missed.",
    points: 10,
  },
  {
    position: 2,
    type: "MULTIPLE_CHOICE",
    prompt:
      "Where may customer personal data classified as Restricted be stored?",
    options: [
      "In any approved company system",
      "In personal cloud storage for backup",
      "In personal email so it can be restored",
      "In any tool the team finds useful",
    ],
    correctAnswer: "In any approved company system",
    rubric:
      "Restricted data may only live in approved systems; personal and unapproved storage are prohibited (Sections 2 and 3).",
    rationale:
      "Data classification rules are the foundation of the policy and directly affect breach exposure.",
    points: 10,
  },
  {
    position: 3,
    type: "MULTIPLE_CHOICE",
    prompt:
      "What is the maximum time allowed to report a suspected data breach?",
    options: [
      "Within 1 hour",
      "Within 24 hours",
      "Within 3 business days",
      "At the next scheduled team meeting",
    ],
    correctAnswer: "Within 1 hour",
    rubric:
      "Section 6 requires reporting to the security team within one hour of discovery.",
    rationale:
      "The one-hour window is a hard requirement and the metric auditors most often test.",
    points: 10,
  },
  {
    position: 4,
    type: "TRUE_FALSE",
    prompt:
      "Sharing your credentials with a trusted colleague is acceptable if multi-factor authentication is enabled.",
    options: null,
    correctAnswer: "False",
    rubric:
      "Accounts are personal and credentials must never be shared, regardless of MFA (Section 3).",
    rationale:
      "Credential sharing undermines attribution and access reviews, which the policy requires quarterly.",
    points: 5,
  },
  {
    position: 5,
    type: "SHORT_ANSWER",
    prompt:
      "A colleague's laptop is lost at the airport. Describe the immediate steps required by the policy.",
    options: null,
    correctAnswer:
      "Report the lost device to the security team within one hour of discovery. Preserve all evidence, including any location details. Do not attempt to investigate the incident yourself. Because the laptop uses full-disk encryption and the VPN, the security team can then assess exposure and notify affected parties if required.",
    rubric:
      "Must include: report within 1 hour to the security team; do not investigate on your own; preserve evidence. Mentioning device encryption or impact assessment is a plus.",
    rationale:
      "Lost devices are the most common breach trigger; the response time and evidence preservation drive regulatory outcomes.",
    points: 15,
  },
  {
    position: 6,
    type: "SHORT_ANSWER",
    prompt:
      "Explain the requirements for handling company data while working on public Wi-Fi.",
    options: null,
    correctAnswer:
      "The VPN must be enabled before any work on public or untrusted networks, and company laptops must use full-disk encryption. Screens must be locked when the workstation is unattended, and confidential conversations must not take place in public spaces without headphones.",
    rubric:
      "Must mention: approved VPN enabled on public networks; full-disk encryption; screen locking when unattended. Headphones/confidential conversations is a plus.",
    rationale:
      "Remote work is where policy compliance is most often skipped, so this tests a high-risk daily behavior.",
    points: 15,
  },
];

const ATTEMPT_PLANS: AttemptPlan[] = [
  {
    email: "rashad@cognity.demo",
    daysAgo: 11,
    objectiveCorrect: { 1: true, 2: true, 3: true, 4: true },
    written: {
      5: {
        score: 14,
        confidence: "high",
        response:
          "Report it to the security team immediately — within one hour of noticing it is missing. Preserve any evidence and do not try to investigate myself. Since the laptop is encrypted, the security team will assess whether any Restricted data was at risk.",
        feedback:
          "Covers the one-hour report, evidence preservation, and avoiding self-investigation. Could add that the VPN limits exposure.",
      },
      6: {
        score: 13,
        confidence: "high",
        response:
          "I must enable the approved VPN before working on any public network, use the encrypted company laptop, and lock my screen whenever I step away. I also should not discuss confidential topics without headphones.",
        feedback:
          "All core requirements are present: VPN, encryption, screen locking, and confidential conversation handling.",
      },
    },
  },
  {
    email: "nigar@cognity.demo",
    daysAgo: 8,
    objectiveCorrect: { 1: true, 2: true, 3: true, 4: false },
    written: {
      5: {
        score: 12,
        confidence: "high",
        response:
          "Tell the security team within an hour. Don't investigate alone and keep any evidence. The incident response team will notify people if regulators need to be involved.",
        feedback:
          "The one-hour report and evidence points are correct. Strong answers also state that you must not investigate the incident yourself.",
      },
      6: {
        score: 12,
        confidence: "medium",
        response:
          "Always connect through the VPN on public Wi-Fi and lock the screen when leaving the laptop. You should avoid confidential calls in public.",
        feedback:
          "VPN and screen locking are covered. Missing the full-disk encryption requirement, which is explicit in the policy.",
      },
    },
  },
  {
    email: "kamran@cognity.demo",
    daysAgo: 6,
    objectiveCorrect: { 1: true, 2: false, 3: false, 4: false },
    written: {
      5: {
        score: 8,
        confidence: "medium",
        response:
          "Let the security team know as soon as possible and fill in a report. They will investigate the laptop.",
        feedback:
          "The response does not commit to the one-hour deadline and omits evidence preservation. Partial credit for alerting security.",
      },
      6: {
        score: 7,
        confidence: "medium",
        response:
          "Use the VPN when you are on public Wi-Fi and be careful about what people can see on your screen.",
        feedback:
          "VPN is mentioned, but encryption and unattended screen locking are missing. Recommend reviewing Sections 5 and 7.",
      },
    },
  },
  {
    email: "sana@cognity.demo",
    daysAgo: 3,
    objectiveCorrect: { 1: true, 2: true, 3: false, 4: true },
    written: {
      5: {
        score: 11,
        confidence: "high",
        response:
          "Report the loss to the security team within one hour, preserve evidence, and do not attempt to investigate it myself. Full-disk encryption reduces the risk of data exposure.",
        feedback:
          "Meets the required points: one-hour reporting, evidence preservation, and no self-investigation.",
      },
      6: {
        score: 11,
        confidence: "high",
        response:
          "The VPN must be on for anything work related, files stay on the encrypted laptop, and the screen gets locked when I leave my seat.",
        feedback:
          "Core requirements covered. Mentioning confidential conversations would make it complete.",
      },
    },
  },
];

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function main() {
  const db = getDb();

  await db.execute(
    sql`truncate table ${answers}, ${attempts}, ${assignments}, ${questions}, ${assessments}, ${documents}, ${users} restart identity cascade`,
  );

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const userSeeds = [
    {
      name: "Aysel Mammadova",
      email: "manager@cognity.demo",
      role: "MANAGER" as const,
      department: "People Operations",
    },
    {
      name: "Leyla Aliyeva",
      email: "employee@cognity.demo",
      role: "EMPLOYEE" as const,
      department: "Customer Success",
    },
    {
      name: "Rashad Hasanov",
      email: "rashad@cognity.demo",
      role: "EMPLOYEE" as const,
      department: "Engineering",
    },
    {
      name: "Nigar Mammadova",
      email: "nigar@cognity.demo",
      role: "EMPLOYEE" as const,
      department: "Sales",
    },
    {
      name: "Kamran Aliyev",
      email: "kamran@cognity.demo",
      role: "EMPLOYEE" as const,
      department: "Operations",
    },
    {
      name: "Sana Ismayilova",
      email: "sana@cognity.demo",
      role: "EMPLOYEE" as const,
      department: "Finance",
    },
    {
      name: "Tural Nabiyev",
      email: "tural@cognity.demo",
      role: "EMPLOYEE" as const,
      department: "Engineering",
    },
  ];

  const insertedUsers = await db
    .insert(users)
    .values(userSeeds.map((user) => ({ ...user, passwordHash })))
    .returning({ id: users.id, email: users.email });

  const userByEmail = new Map(
    insertedUsers.map((user) => [user.email, user.id]),
  );
  const managerId = userByEmail.get("manager@cognity.demo");
  if (!managerId) throw new Error("Manager seed user missing");

  const [document] = await db
    .insert(documents)
    .values({
      title: SAMPLE_POLICY_TITLE,
      content: SAMPLE_POLICY,
      uploadedById: managerId,
      createdAt: daysAgo(15),
    })
    .returning();

  const [assessment] = await db
    .insert(assessments)
    .values({
      documentId: document.id,
      title: "Annual Information Security & Data Protection (2026)",
      status: "PUBLISHED",
      passingScore: 70,
      createdById: managerId,
      publishedAt: daysAgo(13),
      createdAt: daysAgo(14),
    })
    .returning();

  const insertedQuestions = await db
    .insert(questions)
    .values(
      QUESTION_SEEDS.map((question) => ({
        assessmentId: assessment.id,
        position: question.position,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
        correctAnswer: question.correctAnswer,
        rubric: question.rubric,
        rationale: question.rationale,
        points: question.points,
      })),
    )
    .returning({ id: questions.id, position: questions.position });

  const questionByPosition = new Map(
    insertedQuestions.map((question) => [question.position, question]),
  );

  const totalPoints = QUESTION_SEEDS.reduce(
    (sum, question) => sum + question.points,
    0,
  );

  const employeeEmails = userSeeds
    .filter((user) => user.role === "EMPLOYEE")
    .map((user) => user.email);

  const assignmentRows = employeeEmails.map((email) => {
    const userId = userByEmail.get(email);
    if (!userId) throw new Error(`Missing employee ${email}`);
    const plan = ATTEMPT_PLANS.find((item) => item.email === email);
    return {
      assessmentId: assessment.id,
      employeeId: userId,
      status: plan ? ("COMPLETED" as const) : ("PENDING" as const),
      dueAt: daysAgo(-7),
      completedAt: plan ? daysAgo(plan.daysAgo) : null,
      createdAt: daysAgo(13),
    };
  });

  const insertedAssignments = await db
    .insert(assignments)
    .values(assignmentRows)
    .returning({
      id: assignments.id,
      employeeId: assignments.employeeId,
      status: assignments.status,
    });

  const assignmentByEmployee = new Map(
    insertedAssignments.map((assignment) => [
      assignment.employeeId,
      assignment.id,
    ]),
  );

  for (const plan of ATTEMPT_PLANS) {
    const employeeId = userByEmail.get(plan.email);
    if (!employeeId) throw new Error(`Missing employee ${plan.email}`);
    const assignmentId = assignmentByEmployee.get(employeeId);
    if (!assignmentId) throw new Error(`Missing assignment for ${plan.email}`);

    let earned = 0;
    const answerRows: Array<typeof answers.$inferInsert> = [];

    for (const question of QUESTION_SEEDS) {
      const questionRow = questionByPosition.get(question.position);
      if (!questionRow) throw new Error("Question seed missing");

      if (question.type === "SHORT_ANSWER") {
        const grade = plan.written[question.position];
        if (!grade) continue;
        earned += grade.score;
        answerRows.push({
          attemptId: "",
          questionId: questionRow.id,
          response: grade.response,
          aiScore: grade.score,
          aiFeedback: grade.feedback,
          aiConfidence: grade.confidence,
        });
        continue;
      }

      const correct = plan.objectiveCorrect[question.position] === true;
      const score = correct ? question.points : 0;
      earned += score;
      const response = correct
        ? question.correctAnswer
        : (question.options ?? ["True", "False"]).find(
            (option) => option !== question.correctAnswer,
          ) ?? "True";

      answerRows.push({
        attemptId: "",
        questionId: questionRow.id,
        response,
        aiScore: score,
        aiFeedback: correct
          ? "Correct. The response matches the policy requirement."
          : `Incorrect. The policy requires: "${question.correctAnswer}".`,
        aiConfidence: "high",
      });
    }

    const score = Math.round((earned / totalPoints) * 100);
    const passed = score >= assessment.passingScore;
    const submittedAt = daysAgo(plan.daysAgo);

    const [attempt] = await db
      .insert(attempts)
      .values({ assignmentId, score, passed, submittedAt })
      .returning();

    await db
      .insert(answers)
      .values(
        answerRows.map((answer) => ({ ...answer, attemptId: attempt.id })),
      );
  }

  console.log("Seed complete.");
  console.log("  Manager  : manager@cognity.demo / demo1234");
  console.log("  Employee : employee@cognity.demo / demo1234 (pending assignment)");
  console.log(
    `  Data     : ${employeeEmails.length} assignments, ${ATTEMPT_PLANS.length} graded attempts, ${QUESTION_SEEDS.length} questions`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
