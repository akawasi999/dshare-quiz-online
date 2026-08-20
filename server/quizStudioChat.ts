import { z } from "zod";
import { parseAiQuestionDraft } from "./aiQuestionGenerator";

const questionTypeSchema = z.enum(["single", "multiple", "true_false", "fill_blank", "matching", "essay"]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const quizStudioChatInputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4_000) })).min(1).max(12),
  context: z.object({ title: z.string().trim().max(220).optional(), summary: z.string().trim().max(600).optional(), currentQuestionCount: z.number().int().min(0).max(50) }).optional(),
});

const studioChatResponseSchema = z.object({
  action: z.enum(["clarify", "generate"]),
  reply: z.string().trim().min(2).max(1_200),
  detected: z.object({ topic: z.string().trim().max(300).nullable(), type: questionTypeSchema.nullable(), difficulty: difficultySchema.nullable(), count: z.number().int().min(1).max(3).nullable() }),
  questions: z.array(z.object({ type: questionTypeSchema, difficulty: difficultySchema, prompt: z.string(), explanation: z.string(), options: z.array(z.object({ body: z.string(), isCorrect: z.boolean() })), answerConfig: z.record(z.string(), z.unknown()) })).max(3),
  suggestedPrompts: z.array(z.string().trim().min(2).max(180)).max(3),
});

export type QuizStudioChatResponse = ReturnType<typeof parseQuizStudioChatResponse>;

export function buildQuizStudioChatMessages(input: z.infer<typeof quizStudioChatInputSchema>) {
  const studioContext = [input.context?.title ? `Tên Quiz: ${input.context.title}` : null, input.context?.summary ? `Mô tả: ${input.context.summary}` : null, `Số câu hiện có: ${input.context?.currentQuestionCount ?? 0}`].filter(Boolean).join("\n");
  return [
    { role: "system" as const, content: `Bạn là AI đồng biên soạn Quiz tiếng Việt trong Studio Dshare. Phân tích yêu cầu gần nhất của người dùng. Nếu thiếu chủ đề, dạng câu, độ khó hoặc số lượng cần thiết để tạo câu hỏi chất lượng, trả action="clarify", giải thích ngắn nội dung cần bổ sung và suggestedPrompts có 2-3 lựa chọn cụ thể. Nếu yêu cầu đã đủ, trả action="generate" và tạo từ 1 đến 3 câu hỏi cùng đáp án đúng, lời giải và answerConfig hợp lệ. Không tạo nội dung bịa đặt, độc hại hoặc đáp án cho bài thi đang diễn ra. Luôn phản hồi đúng JSON theo schema.

Ngữ cảnh Studio:
${studioContext}` },
    ...input.messages.map(message => ({ role: message.role, content: message.content })),
  ];
}

export function parseQuizStudioChatResponse(content: unknown) {
  const parsed = studioChatResponseSchema.parse(typeof content === "string" ? JSON.parse(content) : content);
  if (parsed.action === "clarify") return { ...parsed, questions: [] };
  const questions = parsed.questions.map(question => ({ ...parseAiQuestionDraft(question, question.type), type: question.type, difficulty: question.difficulty }));
  if (!questions.length) throw new Error("AI chưa trả về câu hỏi hợp lệ.");
  return { ...parsed, questions };
}

const enhancementSchema = z.object({
  action: z.enum(["explain", "rephrase", "latex"]),
  prompt: z.string().trim().min(8).max(5_000),
  explanation: z.string().trim().max(5_000),
  options: z.array(z.object({ body: z.string().trim().min(1).max(2_000), isCorrect: z.boolean() })).max(10),
  answerConfig: z.record(z.string(), z.unknown()),
});

export const questionEnhancementInputSchema = z.object({
  action: z.enum(["explain", "rephrase", "latex"]),
  question: z.object({ type: questionTypeSchema, difficulty: difficultySchema, prompt: z.string().trim().min(8).max(5_000), explanation: z.string().max(5_000), options: z.array(z.object({ body: z.string().max(2_000), isCorrect: z.boolean() })).max(10), answerConfig: z.record(z.string(), z.unknown()).default({}) }),
});

export function buildQuestionEnhancementMessages(input: z.infer<typeof questionEnhancementInputSchema>) {
  const instruction = input.action === "explain" ? "Tạo lời giải chi tiết, rõ từng bước, dựa trên câu hỏi và đáp án đúng hiện có. Không thay đổi câu hỏi hoặc đáp án." : input.action === "rephrase" ? "Viết lại câu hỏi với ngữ cảnh hoặc số liệu khác nhưng giữ cùng mục tiêu kiến thức, dạng câu và đáp án đúng. Các phương án nhiễu phải hợp lý." : "Chỉ sửa lỗi chính tả, chuẩn hóa công thức toán/lý/hóa sang LaTeX trong dấu $...$ và giữ nguyên ý nghĩa, đáp án đúng.";
  return [{ role: "system" as const, content: `Bạn là chuyên gia biên soạn Quiz tiếng Việt. ${instruction} Trả về JSON đúng schema. Không thêm thông tin không có căn cứ.` }, { role: "user" as const, content: JSON.stringify(input.question) }];
}

export function parseQuestionEnhancement(content: unknown, type: z.infer<typeof questionTypeSchema>) {
  const result = enhancementSchema.parse(typeof content === "string" ? JSON.parse(content) : content);
  return { ...parseAiQuestionDraft(result, type), action: result.action };
}
