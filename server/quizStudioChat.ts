import { z } from "zod";
import { parseAiQuestionDraft } from "./aiQuestionGenerator";

const questionTypeSchema = z.enum(["single", "multiple", "true_false", "true_false_statements", "fill_blank", "matching", "ordering", "image_choice", "essay"]);
const difficultySchema = z.enum(["easy", "medium", "hard"]);
const optionSchema = z.object({ body: z.string().trim().min(1).max(2_000), isCorrect: z.boolean() });
const questionDraftSchema = z.object({
  type: questionTypeSchema,
  difficulty: difficultySchema,
  points: z.number().int().min(1).max(100),
  prompt: z.string().trim().min(8).max(5_000),
  explanation: z.string().trim().min(3).max(5_000),
  imageUrl: z.string().url().max(2_000).or(z.literal("")),
  options: z.array(optionSchema).max(10),
  answerConfig: z.record(z.string(), z.unknown()),
});
const studioQuestionContextSchema = z.object({
  id: z.string().trim().min(1).max(120),
  type: questionTypeSchema,
  difficulty: difficultySchema,
  points: z.number().int().min(1).max(100),
  prompt: z.string().trim().max(5_000),
  explanation: z.string().max(5_000),
  imageUrl: z.string().max(2_000),
  options: z.array(z.object({ body: z.string().max(2_000), isCorrect: z.boolean() })).max(10),
  answerConfig: z.record(z.string(), z.unknown()),
});
const operationSchema = z.object({ kind: z.enum(["create", "update", "delete"]), targetId: z.string().trim().min(1).max(120).nullable(), question: questionDraftSchema.nullable() });

export const quizStudioChatInputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4_000) })).min(1).max(12),
  context: z.object({ title: z.string().trim().max(220).optional(), summary: z.string().trim().max(600).optional(), currentQuestionCount: z.number().int().min(0).max(50), questions: z.array(studioQuestionContextSchema).max(50).default([]) }).optional(),
  requestedQuestionCount: z.number().int().min(1).max(20).nullable().optional(),
});

const studioChatResponseSchema = z.object({
  action: z.enum(["clarify", "clarify_count", "apply"]),
  reply: z.string().trim().min(2).max(1_200),
  detected: z.object({ topic: z.string().trim().max(300).nullable(), type: questionTypeSchema.nullable(), difficulty: difficultySchema.nullable(), count: z.number().int().min(1).max(20).nullable() }),
  operations: z.array(operationSchema).max(20),
  suggestedPrompts: z.array(z.string().trim().min(2).max(180)).max(3),
});

export type QuizStudioChatResponse = ReturnType<typeof parseQuizStudioChatResponse>;

export function buildQuizStudioChatMessages(input: z.infer<typeof quizStudioChatInputSchema>) {
  const studioContext = [
    input.context?.title ? `Tên Quiz: ${input.context.title}` : null,
    input.context?.summary ? `Mô tả: ${input.context.summary}` : null,
    `Số câu hiện có: ${input.context?.currentQuestionCount ?? 0}`,
    input.requestedQuestionCount ? `Người tạo đã xác nhận tạo tối đa: ${input.requestedQuestionCount} câu.` : "Người tạo CHƯA xác nhận số lượng câu cần tạo.",
    `Câu hỏi hiện có (dùng id chính xác khi sửa/xoá): ${JSON.stringify(input.context?.questions ?? [])}`,
  ].filter(Boolean).join("\n");
  return [{ role: "system" as const, content: `Bạn là AI đồng biên soạn Quiz tiếng Việt trong Studio Dshare, được phép thao tác toàn quyền trên BẢN NHÁP hiện tại thông qua operations.

Bạn có ba action:
- "clarify": thiếu mục tiêu, chủ đề hoặc thông tin cần thiết khác; operations phải rỗng.
- "clarify_count": mọi yêu cầu có tạo câu mới khi chưa có requestedQuestionCount. LUÔN dùng action này, kể cả người dùng vừa nói một con số; hãy hỏi rõ “Bạn muốn AI tạo tối đa bao nhiêu câu hỏi (1–20)?” và operations phải rỗng.
- "apply": dùng cho sửa/xoá câu hỏi, hoặc tạo mới CHỈ SAU KHI requestedQuestionCount đã có. Operations là các lệnh create, update, delete.

Quy tắc operations:
1. create: targetId=null, question phải đầy đủ; tổng create không vượt requestedQuestionCount, 20, hoặc giới hạn 50 câu của Studio.
2. update: targetId phải đúng id trong ngữ cảnh, question là phiên bản HOÀN CHỈNH sau khi sửa; có thể đổi kiểu, độ khó, điểm, nội dung, ảnh (imageUrl), đáp án, lời giải và answerConfig. Giữ nguyên trường hiện có nếu người dùng không yêu cầu thay đổi.
3. delete: targetId phải đúng id trong ngữ cảnh, question=null.
4. Chỉ dùng các kiểu: single, multiple, true_false, true_false_statements, fill_blank, matching, ordering, image_choice, essay. Mọi câu phải có đáp án/answerConfig hợp lệ, points 1–100. imageUrl chỉ dùng URL ảnh hợp lệ hoặc chuỗi rỗng.
5. Không tự bịa id, không thao tác ngoài yêu cầu, không tạo nội dung độc hại hoặc đáp án cho bài thi đang diễn ra. Luôn phản hồi JSON đúng schema.

Ngữ cảnh Studio:
${studioContext}` }, ...input.messages.map(message => ({ role: message.role, content: message.content }))];
}

export function parseQuizStudioChatResponse(content: unknown) {
  const parsed = studioChatResponseSchema.parse(typeof content === "string" ? JSON.parse(content) : content);
  if (parsed.action !== "apply") return { ...parsed, operations: [] };
  const operations = parsed.operations.map(operation => {
    if (operation.kind === "delete") {
      if (!operation.targetId || operation.question !== null) throw new Error("Lệnh xoá AI không hợp lệ.");
      return operation;
    }
    if (!operation.question || (operation.kind === "create" ? operation.targetId !== null : !operation.targetId)) throw new Error("Lệnh chỉnh sửa AI không hợp lệ.");
    const normalized = parseAiQuestionDraft(operation.question, operation.question.type);
    return { ...operation, question: { ...normalized, type: operation.question.type, difficulty: operation.question.difficulty, points: operation.question.points, imageUrl: operation.question.imageUrl } };
  });
  if (!operations.length) throw new Error("AI chưa trả về thao tác hợp lệ cho bản nháp.");
  return { ...parsed, operations };
}

const enhancementSchema = z.object({ action: z.enum(["explain", "rephrase", "latex"]), prompt: z.string().trim().max(5_000), explanation: z.string().trim().max(5_000), options: z.array(optionSchema).max(10), answerConfig: z.record(z.string(), z.unknown()) });

export const questionEnhancementInputSchema = z.object({ action: z.enum(["explain", "rephrase", "latex"]), question: z.object({ type: questionTypeSchema, difficulty: difficultySchema, prompt: z.string().trim().min(8).max(5_000), explanation: z.string().max(5_000), options: z.array(z.object({ body: z.string().max(2_000), isCorrect: z.boolean() })).max(10), answerConfig: z.record(z.string(), z.unknown()).default({}) }) });

export function buildQuestionEnhancementMessages(input: z.infer<typeof questionEnhancementInputSchema>) {
  const instruction = input.action === "explain" ? "Tạo lời giải chi tiết, rõ từng bước, dựa trên câu hỏi và đáp án đúng hiện có. Không thay đổi câu hỏi hoặc đáp án." : input.action === "rephrase" ? "Viết lại câu hỏi với ngữ cảnh hoặc số liệu khác nhưng giữ cùng mục tiêu kiến thức, dạng câu và đáp án đúng. Các phương án nhiễu phải hợp lý." : "Chỉ sửa lỗi chính tả, chuẩn hóa công thức toán/lý/hóa sang LaTeX trong dấu $...$ và giữ nguyên ý nghĩa, đáp án đúng.";
  return [{ role: "system" as const, content: `Bạn là chuyên gia biên soạn Quiz tiếng Việt. ${instruction} Trả về JSON đúng schema. Không thêm thông tin không có căn cứ.` }, { role: "user" as const, content: JSON.stringify(input.question) }];
}

export function parseQuestionEnhancement(content: unknown, type: z.infer<typeof questionTypeSchema>) {
  const result = enhancementSchema.parse(typeof content === "string" ? JSON.parse(content) : content);
  return { ...parseAiQuestionDraft(result, type), action: result.action };
}
