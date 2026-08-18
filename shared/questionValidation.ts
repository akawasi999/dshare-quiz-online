export type QuestionValidationType = "single" | "multiple" | "true_false" | "fill_blank" | "image" | "matching";

export type EditableQuestionConfig = {
  type: QuestionValidationType;
  options: Array<{ body: string; isCorrect: boolean }>;
  answerConfig?: Record<string, unknown>;
  imageUrl?: string | null;
};

export function validateQuestionConfiguration(input: EditableQuestionConfig) {
  const cleanOptions = input.options.filter(option => option.body.trim());
  const correctOptions = cleanOptions.filter(option => option.isCorrect);
  if (["single", "image"].includes(input.type)) {
    if (cleanOptions.length < 2) return "Câu chọn một đáp án cần ít nhất hai phương án.";
    if (correctOptions.length !== 1) return "Câu chọn một đáp án chỉ được có đúng một phương án đúng.";
    if (input.type === "image" && !input.imageUrl?.trim()) return "Câu hỏi hình ảnh cần có URL hình minh họa.";
  }
  if (input.type === "multiple" && correctOptions.length < 2) return "Câu nhiều đáp án cần tối thiểu hai phương án đúng.";
  if (input.type === "true_false") {
    const labels = cleanOptions.map(option => option.body.trim().toLocaleLowerCase("vi-VN")).sort().join("|");
    if (labels !== "sai|đúng" || correctOptions.length !== 1) return "Câu đúng/sai phải gồm hai lựa chọn Đúng và Sai, với đúng một đáp án đúng.";
  }
  if (input.type === "fill_blank") {
    const accepted = input.answerConfig?.acceptedAnswers;
    if (!Array.isArray(accepted) || !accepted.some(answer => typeof answer === "string" && answer.trim())) return "Câu điền từ cần ít nhất một đáp án được chấp nhận.";
  }
  if (input.type === "matching") {
    const pairs = input.answerConfig?.pairs;
    if (!Array.isArray(pairs) || pairs.length < 2 || pairs.some(pair => !pair || typeof pair !== "object" || typeof (pair as Record<string, unknown>).left !== "string" || !String((pair as Record<string, unknown>).left).trim() || typeof (pair as Record<string, unknown>).right !== "string" || !String((pair as Record<string, unknown>).right).trim())) return "Câu ghép nối cần tối thiểu hai cặp trái–phải hợp lệ.";
  }
  return undefined;
}
