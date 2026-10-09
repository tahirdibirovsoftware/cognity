import "server-only";

import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { z } from "zod";

export const generatedQuestionSchema = z.object({
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
  prompt: z.string().min(5).max(1000),
  options: z.array(z.string().min(1).max(500)).max(8).optional(),
  correctAnswer: z.string().min(1).max(1000),
  rubric: z.string().min(5).max(2000),
  rationale: z.string().min(5).max(2000),
  points: z.number().int().min(1).max(100),
});

export const generatedAssessmentSchema = z.object({
  title: z.string().min(2).max(200),
  questions: z.array(generatedQuestionSchema).min(3).max(10),
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
  const policy = input.content.slice(0, 12_000);

  const systemPrompt = [
    "You are a senior compliance training specialist who builds audit-ready assessments for enterprise HR teams.",
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
  ].join("\n");

  try {
    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: generatedAssessmentSchema,
      temperature: 0.2,
      system: systemPrompt,
      prompt: `Policy document title: ${input.title}\n\nPolicy document:\n"""\n${policy}\n"""\n\nGenerate the full assessment including the title.`,
    });
    return object;
  } catch (firstError) {
    console.warn("[generateAssessment] first attempt failed, retrying with focused excerpt", firstError);
    const focused = input.content.slice(0, 7_000);
    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      schema: generatedAssessmentSchema,
      temperature: 0.2,
      system: systemPrompt,
      prompt: `Policy document title: ${input.title}\n\nPolicy document excerpt:\n"""\n${focused}\n"""\n\nGenerate the full assessment including the title.`,
    });
    return object;
  }
}
