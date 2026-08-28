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
  options: Array<{ body: string; imageUrl?: string; isCorrect: boolean }>;
  answerConfig: Record<string, unknown>;
};

function normalizeAdvancedAnswerConfig(type: QuestionValidationType, answerConfig: Record<string, unknown>) {
  if (type === "true_false_statements") {
    const statements = Array.isArray(answerConfig.statements) ? answerConfig.statements.flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      const answer = typeof value.answer === "string" ? value.answer.trim().toLocaleLowerCase("vi-VN") : "";
      const correct = typeof value.correct === "boolean" ? value.correct : answer === "có" || answer === "đúng" ? true : answer === "không" || answer === "sai" ? false : undefined;
      const text = typeof value.text === "string" ? value.text : typeof value.content === "string" ? value.content : "";
      return typeof correct === "boolean" ? [{ id: typeof value.id === "string" && value.id.trim() ? value.id : `statement-${index + 1}`, text, correct, ...(typeof value.imageUrl === "string" ? { imageUrl: value.imageUrl } : {}) }] : [];
    }) : [];
    return { ...answerConfig, statements };
  }
  if (type === "matching") {
    const pairs = Array.isArray(answerConfig.pairs) ? answerConfig.pairs.flatMap(item => {
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      return typeof value.left === "string" && typeof value.right === "string" ? [{ left: value.left, right: value.right, ...(typeof value.leftImageUrl === "string" ? { leftImageUrl: value.leftImageUrl } : {}), ...(typeof value.rightImageUrl === "string" ? { rightImageUrl: value.rightImageUrl } : {}) }] : [];
    }) : [];
    return { ...answerConfig, pairs };
  }
  if (type === "ordering") {
    const source = Array.isArray(answerConfig.orderingItems) ? answerConfig.orderingItems : Array.isArray(answerConfig.steps) ? answerConfig.steps : [];
    const orderingItems = source.flatMap((item, index) => {
      if (typeof item === "string") return [{ id: `step-${index + 1}`, text: item }];
      if (!item || typeof item !== "object") return [];
      const value = item as Record<string, unknown>;
      const text = typeof value.text === "string" ? value.text : typeof value.content === "string" ? value.content : typeof value.label === "string" ? value.label : "";
      return [{ id: typeof value.id === "string" && value.id.trim() ? value.id : `step-${index + 1}`, text, ...(typeof value.imageUrl === "string" ? { imageUrl: value.imageUrl } : {}) }];
    });
    return { ...answerConfig, orderingItems };
  }
  return answerConfig;
}

export function parseAiQuestionDraft(content: unknown, type: QuestionValidationType): AiQuestionDraft {
  const parsed = typeof content === "string" ? JSON.parse(content) : content;
  const draft = z.object({
    prompt: z.string().trim().min(8).max(5000),
    explanation: z.string().trim().min(3).max(5000),
    options: z.array(z.object({ body: z.string().trim().min(1).max(2000), imageUrl: z.string().max(2000).optional(), isCorrect: z.boolean() })).max(10),
    answerConfig: z.record(z.string(), z.unknown()).default({}),
  }).parse(parsed);
  const answerConfig = normalizeAdvancedAnswerConfig(type, draft.answerConfig);
  const error = validateQuestionConfiguration({ type, options: draft.options, answerConfig, imageUrl: null });
  if (error) throw new Error(error);
  return { ...draft, answerConfig };
}
