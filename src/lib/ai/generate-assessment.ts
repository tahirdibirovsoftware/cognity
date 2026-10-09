import "server-only";

import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { z } from "zod";

export const generatedQuestionSchema = z.object({
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
  prompt: z.string().min(10).max(400),
  options: z.array(z.string().min(1).max(200)).max(6).optional(),
  correctAnswer: z.string().min(1).max(400),
  rubric: z.string().min(10).max(600),
  rationale: z.string().min(10).max(600),
  points: z.number().int().min(5).max(20),
});

export const generatedAssessmentSchema = z.object({
  title: z.string().min(3).max(120),
  questions: z.array(generatedQuestionSchema).min(4).max(8),
});

export type GeneratedAssessment = z.infer<typeof generatedAssessmentSchema>;

function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not set");
  return createDeepSeek({ apiKey });
}

export async function generateAssessment(input: {
  title: string;
  content: string;
}): Promise<GeneratedAssessment> {
  const deepseek = getClient();
  const policy = input.content.slice(0, 16_000);

  const { object } = await generateObject({
    model: deepseek("deepseek-chat"),
    schema: generatedAssessmentSchema,
    temperature: 0.2,
    system: [
      "You are a senior compliance training specialist who builds audits-ready assessments for enterprise HR teams.",
      "You generate precise, fair assessments grounded strictly in the provided policy document.",
      "Rules:",
      "- Write exactly 6 questions: 3 MULTIPLE_CHOICE, 1 TRUE_FALSE, 2 SHORT_ANSWER.",
      "- Every question must be answerable from the policy text alone. Never invent rules.",
      "- For MULTIPLE_CHOICE provide 4 options; correctAnswer must exactly match one option.",
      "- For TRUE_FALSE correctAnswer must be either \"True\" or \"False\".",
      "- For SHORT_ANSWER, correctAnswer is a model answer and rubric lists the specific points a strong answer must include.",
      "- rationale explains why the question matters for compliance and cites the section it covers.",
      "- points: MULTIPLE_CHOICE 10, TRUE_FALSE 5, SHORT_ANSWER 15.",
      "- Neutral, professional tone. No trick questions.",
    ].join("\n"),
    prompt: `Policy document title: ${input.title}

Policy document:
"""
${policy}
"""

Generate the full assessment including the title.`,
  });

  return object;
}
