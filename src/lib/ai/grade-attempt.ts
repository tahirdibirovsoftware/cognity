import "server-only";

import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { z } from "zod";
import type { QuestionType } from "@/db/schema";

export type GradableQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correctAnswer: string;
  rubric: string;
  points: number;
};

export type GradedAnswer = {
  questionId: string;
  response: string;
  score: number;
  feedback: string;
  confidence: "high" | "medium" | "low";
};

const gradingSchema = z.object({
  grades: z.array(
    z.object({
      questionId: z.string(),
      score: z.number().min(0),
      feedback: z.string().min(5).max(600),
      confidence: z.enum(["high", "medium", "low"]),
    }),
  ),
});

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.;,!]+$/g, "");
}

function gradeObjective(question: GradableQuestion, response: string): GradedAnswer {
  const correct = normalize(question.correctAnswer) === normalize(response);
  return {
    questionId: question.id,
    response,
    score: correct ? question.points : 0,
    feedback: correct
      ? "Correct. The response matches the policy requirement."
      : `Incorrect. The policy requires: "${question.correctAnswer}".`,
    confidence: "high",
  };
}

function extractKeywords(value: string) {
  const stopWords = new Set([
    "the", "and", "for", "with", "that", "this", "must", "will", "any",
    "from", "into", "your", "their", "have", "been", "within", "than",
    "such", "only", "when", "where", "which", "they", "them", "then",
    "a", "an", "of", "to", "in", "on", "or", "is", "are", "be", "by",
  ]);
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word)),
    ),
  );
}

function fallbackSubjectiveGrade(
  question: GradableQuestion,
  response: string,
): GradedAnswer {
  const keywords = extractKeywords(`${question.correctAnswer} ${question.rubric}`);
  const target = keywords.slice(0, 8);
  const haystack = response.toLowerCase();
  const matched = target.filter((keyword) => haystack.includes(keyword));
  const ratio = target.length === 0 ? 0 : matched.length / target.length;
  const score = Math.round(question.points * Math.min(1, ratio));

  return {
    questionId: question.id,
    response,
    score,
    feedback:
      score >= Math.ceil(question.points * 0.7)
        ? `Response covers the key requirements (${matched.slice(0, 4).join(", ")}).`
        : `Response is missing key requirements. Expected points: ${target.slice(0, 5).join(", ")}.`,
    confidence: "low",
  };
}

async function gradeSubjective(
  questions: GradableQuestion[],
  responses: Record<string, string>,
): Promise<GradedAnswer[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return questions.map((question) =>
      fallbackSubjectiveGrade(question, responses[question.id] ?? ""),
    );
  }

  const deepseek = createDeepSeek({ apiKey });

  try {
    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: gradingSchema,
      temperature: 0.1,
      system: [
        "You are an exacting but fair compliance assessor grading written answers against a policy and rubric.",
        "For each question, award a score from 0 to the maximum points. Partial credit is allowed.",
        "Feedback must cite what the answer got right or missed in 1-2 sentences. Never reveal the full model answer verbatim.",
        "Confidence reflects how certain you are: high when the rubric is clearly met or clearly missed, medium for partial, low when the answer is ambiguous.",
      ].join("\n"),
      prompt: `Grade the following answers.

${questions
  .map(
    (question) => `Question ID: ${question.id}
Question: ${question.prompt}
Maximum points: ${question.points}
Model answer: ${question.correctAnswer}
Rubric: ${question.rubric}
Employee answer: ${responses[question.id] || "(no answer provided)"}`,
  )
  .join("\n\n")}`,
    });

    return questions.map((question) => {
      const grade = object.grades.find((item) => item.questionId === question.id);
      if (!grade) {
        return fallbackSubjectiveGrade(question, responses[question.id] ?? "");
      }
      return {
        questionId: question.id,
        response: responses[question.id] ?? "",
        score: Math.max(0, Math.min(question.points, Math.round(grade.score))),
        feedback: grade.feedback,
        confidence: grade.confidence,
      };
    });
  } catch {
    return questions.map((question) =>
      fallbackSubjectiveGrade(question, responses[question.id] ?? ""),
    );
  }
}

export async function gradeAnswers(
  questions: GradableQuestion[],
  responses: Record<string, string>,
): Promise<GradedAnswer[]> {
  const objective = questions.filter(
    (question) => question.type !== "SHORT_ANSWER",
  );
  const subjective = questions.filter(
    (question) => question.type === "SHORT_ANSWER",
  );

  const gradedObjective = objective.map((question) =>
    gradeObjective(question, responses[question.id] ?? ""),
  );
  const gradedSubjective = await gradeSubjective(subjective, responses);

  const byId = new Map(
    [...gradedObjective, ...gradedSubjective].map((grade) => [
      grade.questionId,
      grade,
    ]),
  );

  return questions.map(
    (question) =>
      byId.get(question.id) ?? {
        questionId: question.id,
        response: responses[question.id] ?? "",
        score: 0,
        feedback: "No grade produced.",
        confidence: "low" as const,
      },
  );
}
