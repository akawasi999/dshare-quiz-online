import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

export type DocumentQuestion = {
  prompt: string;
  explanation: string;
  options: Array<{ body: string; isCorrect: boolean }>;
  answerConfig: Record<string, unknown>;
  difficulty: "easy" | "medium" | "hard";
};

const maxDocumentBytes = 15 * 1024 * 1024;

export async function extractQuizDocumentText(input: { userId: number; fileName: string; mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; base64: string }) {
  const bytes = Buffer.from(input.base64.split(",").pop() ?? "", "base64");
  if (!bytes.length || bytes.length > maxDocumentBytes) throw new Error("Tệp PDF hoặc Word phải có dung lượng từ 1 byte đến tối đa 15 MB.");
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "document";
  const stored = await storagePut(`quiz-source-documents/${input.userId}/${Date.now()}-${safeName}`, bytes, input.mimeType);
  let text = "";
  if (input.mimeType === "application/pdf") {
    const parser = new PDFParse({ data: bytes });
    try { text = (await parser.getText()).text; } finally { await parser.destroy(); }
  } else {
    text = (await mammoth.extractRawText({ buffer: bytes })).value;
  }
  const normalizedText = text.replace(/\u0000/g, " ").replace(/\s{3,}/g, " ").trim();
  if (normalizedText.length < 60) throw new Error("Không trích xuất được đủ văn bản từ tài liệu. Hãy dùng PDF/Word có lớp chữ có thể chọn được.");
  return { text: normalizedText.slice(0, 45_000), sourceUrl: stored.url, sourceName: input.fileName };
}

export async function generateMultipleChoiceFromDocument(input: { text: string; count: number; difficulty: "easy" | "medium" | "hard" }) {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Bạn là chuyên gia biên soạn câu hỏi trắc nghiệm bằng tiếng Việt. Chỉ sử dụng thông tin trong tài liệu được cung cấp. Trả về JSON hợp lệ, không thêm markdown." },
      { role: "user", content: `Dựa hoàn toàn trên tài liệu sau, tạo ${input.count} câu hỏi trắc nghiệm chọn một đáp án ở mức ${input.difficulty}. Mỗi câu có đúng 4 phương án, duy nhất 1 phương án đúng, lời giải ngắn giải thích dựa trên tài liệu.\n\nTÀI LIỆU:\n${input.text}` },
    ],
    maxTokens: Math.min(8_000, 900 + input.count * 700),
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "document_quiz_questions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  prompt: { type: "string" },
                  explanation: { type: "string" },
                  options: { type: "array", items: { type: "object", properties: { body: { type: "string" }, isCorrect: { type: "boolean" } }, required: ["body", "isCorrect"], additionalProperties: false } },
                },
                required: ["prompt", "explanation", "options"],
                additionalProperties: false,
              },
            },
          },
          required: ["questions"],
          additionalProperties: false,
        },
      },
    },
  });
  const responseContent = response.choices[0]?.message.content;
  const parsed = JSON.parse(typeof responseContent === "string" ? responseContent : "{}") as { questions?: Array<{ prompt?: unknown; explanation?: unknown; options?: Array<{ body?: unknown; isCorrect?: unknown }> }> };
  if (!Array.isArray(parsed.questions) || parsed.questions.length !== input.count) throw new Error("AI chưa trả về đủ số lượng câu hỏi hợp lệ.");
  return parsed.questions.map((question, index) => {
    if (typeof question.prompt !== "string" || question.prompt.trim().length < 8 || typeof question.explanation !== "string" || !Array.isArray(question.options) || question.options.length !== 4) throw new Error(`Câu hỏi ${index + 1} có cấu trúc không hợp lệ.`);
    const options = question.options.map(option => ({ body: typeof option.body === "string" ? option.body.trim() : "", isCorrect: Boolean(option.isCorrect) }));
    if (options.some(option => !option.body) || options.filter(option => option.isCorrect).length !== 1) throw new Error(`Câu hỏi ${index + 1} cần bốn đáp án với đúng một đáp án đúng.`);
    return { prompt: question.prompt.trim(), explanation: question.explanation.trim(), options, answerConfig: {}, difficulty: input.difficulty } satisfies DocumentQuestion;
  });
}
