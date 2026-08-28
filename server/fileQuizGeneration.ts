import mammoth from "mammoth";
import { parseOffice } from "officeparser";
import { PDFParse } from "pdf-parse";
import { z } from "zod";
import { parseAiQuestionDraft, type AiQuestionDraft } from "./aiQuestionGenerator";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

export const aiQuizFileMimeTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain"] as const;
export type AiQuizFileMimeType = (typeof aiQuizFileMimeTypes)[number];
export const aiQuizFileInputSchema = z.object({
  fileName: z.string().trim().min(1).max(160),
  mimeType: z.enum(aiQuizFileMimeTypes),
  base64: z.string().min(4).max(22_000_000),
  questionCount: z.number().int().min(1).max(20).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

const maxFileBytes = 15 * 1024 * 1024;
const generatedQuestionTypes = ["single", "true_false_statements", "matching", "ordering"] as const;
type GeneratedQuestionType = (typeof generatedQuestionTypes)[number];
export type GeneratedFileQuizQuestion = AiQuestionDraft & { type: GeneratedQuestionType; difficulty: "easy" | "medium" | "hard"; points: number; imageUrl: string };

export function getAiQuizFileMimeType(fileName: string): AiQuizFileMimeType | null {
  const name = fileName.trim().toLocaleLowerCase("en-US");
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (name.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (name.endsWith(".txt")) return "text/plain";
  return null;
}

export function normalizeExtractedFileText(text: string) {
  return text.replace(/\u0000/g, " ").replace(/\r\n?/g, "\n").replace(/[\t ]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function decodeBase64(base64: string) {
  return Buffer.from(base64.split(",").pop() ?? "", "base64");
}

export async function extractQuizFileText(input: { userId: number; fileName: string; mimeType: AiQuizFileMimeType; base64: string }) {
  if (getAiQuizFileMimeType(input.fileName) !== input.mimeType) throw new Error("Định dạng tệp hoặc MIME type không hợp lệ.");
  const bytes = decodeBase64(input.base64);
  if (!bytes.length || bytes.length > maxFileBytes) throw new Error("Tệp tải lên phải có dung lượng từ 1 byte đến tối đa 15 MB.");
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "quiz-source";
  const stored = await storagePut(`quiz-file-sources/${input.userId}/${Date.now()}-${safeName}`, bytes, input.mimeType);
  let text = "";
  if (input.mimeType === "application/pdf") {
    const parser = new PDFParse({ data: bytes });
    try { text = (await parser.getText()).text; } finally { await parser.destroy(); }
  } else if (input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    text = (await mammoth.extractRawText({ buffer: bytes })).value;
  } else if (input.mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
    text = (await parseOffice(bytes, { extractAttachments: false })).toText();
  } else {
    text = bytes.toString("utf8");
  }
  const normalized = normalizeExtractedFileText(text);
  if (normalized.length < 60) throw new Error("Không trích xuất được đủ văn bản từ tệp. Hãy kiểm tra nội dung hoặc thử một tệp rõ ràng hơn.");
  return { text: normalized.slice(0, 45_000), sourceName: input.fileName, sourceUrl: stored.url };
}

const fileGenerationResponseSchema = z.object({
  questions: z.array(z.object({
    type: z.enum(generatedQuestionTypes),
    difficulty: z.enum(["easy", "medium", "hard"]),
    points: z.number().int().min(1).max(100),
    prompt: z.string(),
    explanation: z.string(),
    options: z.array(z.object({ body: z.string(), isCorrect: z.boolean() })),
    answerConfig: z.record(z.string(), z.unknown()),
  })),
});

export function parseGeneratedFileQuizQuestions(content: unknown, requestedCount: number): GeneratedFileQuizQuestion[] {
  const parsed = fileGenerationResponseSchema.parse(typeof content === "string" ? JSON.parse(content) : content);
  if (parsed.questions.length !== requestedCount) throw new Error("AI chưa trả về đủ số lượng câu hỏi hợp lệ.");
  return parsed.questions.map((question, index) => {
    const draft = parseAiQuestionDraft(question, question.type);
    return { ...draft, type: question.type, difficulty: question.difficulty, points: question.points, imageUrl: "" };
  });
}

export async function generateQuizQuestionsFromFile(input: { text: string; questionCount: number; difficulty: "easy" | "medium" | "hard" }) {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Bạn là chuyên gia biên soạn Quiz tiếng Việt. Chỉ dùng thông tin trong tài liệu, không bịa dữ kiện và chỉ trả về JSON hợp lệ, không Markdown." },
      { role: "user", content: `Dựa hoàn toàn trên tài liệu dưới đây, tạo đúng ${input.questionCount} câu hỏi mức ${input.difficulty}. Đa dạng hợp lý các kiểu single, true_false_statements, matching, ordering nếu nội dung tài liệu cho phép. Với single phải có đúng 4 options và đúng 1 đáp án. Với true_false_statements dùng options=[] cùng answerConfig.statements gồm 2–8 phần tử {id,text,correct}; correct=true là Có, false là Không. Với matching dùng options=[] cùng answerConfig.pairs gồm tối thiểu 2 cặp {left,right}. Với ordering dùng options=[] cùng answerConfig.orderingItems gồm 2–10 bước {id,text} theo thứ tự đúng. Mỗi câu cần prompt, explanation, difficulty, points 1–100, options và answerConfig hợp lệ.\n\nTÀI LIỆU:\n${input.text}` },
    ],
    maxTokens: Math.min(12_000, 1_400 + input.questionCount * 900),
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "file_quiz_questions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: generatedQuestionTypes },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  points: { type: "integer", minimum: 1, maximum: 100 },
                  prompt: { type: "string" },
                  explanation: { type: "string" },
                  options: { type: "array", items: { type: "object", properties: { body: { type: "string" }, isCorrect: { type: "boolean" } }, required: ["body", "isCorrect"], additionalProperties: false } },
                  answerConfig: { type: "object", additionalProperties: true },
                },
                required: ["type", "difficulty", "points", "prompt", "explanation", "options", "answerConfig"],
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
  return parseGeneratedFileQuizQuestions(response.choices[0]?.message.content, input.questionCount);
}
