export type StudioImportedQuestion = { prompt: string; explanation: string; type: string; difficulty: string; points?: number; options: Array<{ body: string; isCorrect: boolean }>; accepted?: string; pairs?: Array<{ left: string; right: string }>; outline?: string };
type StudioFileKind = { kind: "document"; mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" } | { kind: "spreadsheet"; mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "application/vnd.ms-excel" };
export type AiQuizGenerationFileKind = { mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "text/plain" };

export function getQuizStudioFileKind(file: File): StudioFileKind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return { kind: "document" as const, mimeType: "application/pdf" };
  if (name.endsWith(".docx")) return { kind: "document" as const, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  if (name.endsWith(".xlsx")) return { kind: "spreadsheet" as const, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  if (name.endsWith(".xls")) return { kind: "spreadsheet" as const, mimeType: "application/vnd.ms-excel" };
  return null;
}

export function validateQuizStudioFile(file: File) {
  if (file.size > 15 * 1024 * 1024) return "Tệp đính kèm tối đa 15 MB.";
  if (!getQuizStudioFileKind(file)) return "Chỉ hỗ trợ Excel (.xlsx/.xls), Word (.docx) hoặc PDF.";
  return null;
}

export function getAiQuizGenerationFileKind(file: File): AiQuizGenerationFileKind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return { mimeType: "application/pdf" };
  if (name.endsWith(".docx")) return { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  if (name.endsWith(".pptx")) return { mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
  if (name.endsWith(".txt")) return { mimeType: "text/plain" };
  return null;
}

export function validateAiQuizGenerationFile(file: File) {
  if (file.size > 15 * 1024 * 1024) return "Tệp tải lên tối đa 15 MB.";
  if (!getAiQuizGenerationFileKind(file)) return "Chỉ hỗ trợ Word (.docx), PDF, PowerPoint (.pptx) hoặc TXT.";
  return null;
}

export function toStudioQuestion(question: StudioImportedQuestion) {
  const answerConfig = question.type === "fill_blank" ? { acceptedAnswers: (question.accepted ?? "").split("|").map(value => value.trim()).filter(Boolean) } : question.type === "matching" ? { pairs: question.pairs ?? [] } : question.type === "essay" ? { sampleOutline: question.outline ?? "" } : {};
  return { prompt: question.prompt, explanation: question.explanation, options: question.options, answerConfig, type: question.type, difficulty: question.difficulty || "medium" };
}
