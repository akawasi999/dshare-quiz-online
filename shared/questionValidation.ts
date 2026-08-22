export type QuestionValidationType = "single" | "multiple" | "true_false" | "true_false_statements" | "fill_blank" | "image" | "matching" | "essay";

export type TrueFalseStatement = { id: string; text: string; correct: boolean };

export function getTrueFalseStatements(answerConfig?: Record<string, unknown>): TrueFalseStatement[] {
  const values = answerConfig?.statements;
  if (!Array.isArray(values)) return [];
  return values.flatMap(value => {
    if (!value || typeof value !== "object") return [];
    const statement = value as Record<string, unknown>;
    if (typeof statement.id !== "string" || typeof statement.text !== "string" || typeof statement.correct !== "boolean") return [];
    return [{ id: statement.id, text: statement.text, correct: statement.correct }];
  });
}

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
  if (input.type === "true_false_statements") {
    const statements = getTrueFalseStatements(input.answerConfig);
    if (statements.length < 2 || statements.length > 8) return "Câu nhận định Đúng/Sai cần từ hai đến tám nhận định hợp lệ.";
    if (new Set(statements.map(statement => statement.id.trim())).size !== statements.length || statements.some(statement => !statement.id.trim() || statement.text.trim().length < 3)) return "Mỗi nhận định cần mã riêng và nội dung tối thiểu ba ký tự.";
  }
  if (input.type === "fill_blank") {
    const accepted = input.answerConfig?.acceptedAnswers;
    if (!Array.isArray(accepted) || !accepted.some(answer => typeof answer === "string" && answer.trim())) return "Câu điền từ cần ít nhất một đáp án được chấp nhận.";
  }
  if (input.type === "matching") {
    const pairs = input.answerConfig?.pairs;
    if (!Array.isArray(pairs) || pairs.length < 2 || pairs.some(pair => !pair || typeof pair !== "object" || typeof (pair as Record<string, unknown>).left !== "string" || !String((pair as Record<string, unknown>).left).trim() || typeof (pair as Record<string, unknown>).right !== "string" || !String((pair as Record<string, unknown>).right).trim())) return "Câu ghép nối cần tối thiểu hai cặp trái–phải hợp lệ.";
  }
  if (input.type === "essay") {
    const sampleOutline = input.answerConfig?.sampleOutline;
    if (typeof sampleOutline !== "string" || !sampleOutline.trim()) return "Câu tự luận cần có dàn ý hoặc đáp án mẫu.";
  }
  return undefined;
}
