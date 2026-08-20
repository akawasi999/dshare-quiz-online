import { z } from "zod";
import { validateQuestionConfiguration, type QuestionValidationType } from "../shared/questionValidation";

export const aiQuestionInputSchema = z.object({
  lessonId: z.number().int().positive(),
  type: z.enum(["single", "multiple", "true_false", "fill_blank", "matching", "essay"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic: z.string().trim().min(3).max(300),
  context: z.string().trim().max(3000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(6),
});

export type AiQuestionDraft = {
  prompt: string;
  explanation: string;
  options: Array<{ body: string; isCorrect: boolean }>;
  answerConfig: Record<string, unknown>;
};

export function parseAiQuestionDraft(content: unknown, type: QuestionValidationType): AiQuestionDraft {
  const parsed = typeof content === "string" ? JSON.parse(content) : content;
  const draft = z.object({
    prompt: z.string().trim().min(8).max(5000),
    explanation: z.string().trim().min(3).max(5000),
    options: z.array(z.object({ body: z.string().trim().min(1).max(2000), isCorrect: z.boolean() })).max(10),
    answerConfig: z.record(z.string(), z.unknown()).default({}),
  }).parse(parsed);
  const error = validateQuestionConfiguration({ type, options: draft.options, answerConfig: draft.answerConfig, imageUrl: null });
  if (error) throw new Error(error);
  return draft;
}
