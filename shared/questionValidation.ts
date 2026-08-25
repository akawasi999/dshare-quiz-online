export type QuestionValidationType = "single" | "multiple" | "true_false" | "true_false_statements" | "fill_blank" | "image" | "matching" | "ordering" | "image_choice" | "audio" | "video" | "hotspot" | "short_answer_ai" | "essay" | "essay_ai";

export type TrueFalseStatement = { id: string; text: string; correct: boolean };
export type MatchingPair = { left: string; right: string };
export type OrderingItem = { id: string; text: string };
export type Hotspot = { x: number; y: number; radius: number };

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

export function getMatchingPairs(answerConfig?: Record<string, unknown>): MatchingPair[] {
  const values = answerConfig?.pairs;
  if (!Array.isArray(values)) return [];
  return values.flatMap(value => {
    if (!value || typeof value !== "object") return [];
    const pair = value as Record<string, unknown>;
    if (typeof pair.left !== "string" || typeof pair.right !== "string") return [];
    const left = pair.left.trim(); const right = pair.right.trim();
    return left && right ? [{ left, right }] : [];
  });
}

export function getAcceptedAnswers(answerConfig?: Record<string, unknown>) {
  const values = answerConfig?.acceptedAnswers;
  if (!Array.isArray(values)) return [];
  return values.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).map(value => value.trim());
}

export function getOrderingItems(answerConfig?: Record<string, unknown>): OrderingItem[] {
  const values = answerConfig?.orderingItems;
  if (!Array.isArray(values)) return [];
  return values.flatMap(value => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.text !== "string") return [];
    const id = item.id.trim(); const text = item.text.trim();
    return id && text ? [{ id, text }] : [];
  });
}

export function getHotspots(answerConfig?: Record<string, unknown>): Hotspot[] {
  const values = answerConfig?.hotspots;
  if (!Array.isArray(values)) return [];
  return values.flatMap(value => {
    if (!value || typeof value !== "object") return [];
    const spot = value as Record<string, unknown>;
    const x = Number(spot.x); const y = Number(spot.y); const radius = Number(spot.radius ?? 8);
    return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(radius) && x >= 0 && x <= 100 && y >= 0 && y <= 100 && radius >= 1 && radius <= 25 ? [{ x, y, radius }] : [];
  });
}

export type EditableQuestionConfig = { type: QuestionValidationType; options: Array<{ body: string; isCorrect: boolean }>; answerConfig?: Record<string, unknown>; imageUrl?: string | null };

function hasConfiguredMedia(answerConfig?: Record<string, unknown>, kind?: "audio" | "video") {
  const media = answerConfig?.media;
  return Boolean(media && typeof media === "object" && typeof (media as Record<string, unknown>).url === "string" && String((media as Record<string, unknown>).url).trim() && (!kind || (media as Record<string, unknown>).kind === kind));
}

export function validateQuestionConfiguration(input: EditableQuestionConfig) {
  const cleanOptions = input.options.filter(option => option.body.trim());
  const correctOptions = cleanOptions.filter(option => option.isCorrect);
  if (["single", "image", "image_choice", "audio", "video"].includes(input.type)) {
    if (cleanOptions.length < 2) return "Câu chọn một đáp án cần ít nhất hai phương án.";
    if (correctOptions.length !== 1) return "Câu chọn một đáp án chỉ được có đúng một phương án đúng.";
    if (["image", "image_choice"].includes(input.type) && !input.imageUrl?.trim()) return "Câu hỏi hình ảnh cần có URL hình minh họa.";
    if (input.type === "image_choice" && (cleanOptions.length < 2 || cleanOptions.length > 6)) return "Câu chọn ảnh cần từ hai đến sáu phương án.";
    if (input.type === "audio" && !hasConfiguredMedia(input.answerConfig, "audio")) return "Câu hỏi âm thanh cần có tệp audio hợp lệ.";
    if (input.type === "video" && !hasConfiguredMedia(input.answerConfig, "video")) return "Câu hỏi video cần có tệp video hợp lệ.";
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
  if (["fill_blank", "short_answer_ai"].includes(input.type) && !getAcceptedAnswers(input.answerConfig).length) return "Câu trả lời ngắn cần ít nhất một đáp án được chấp nhận.";
  if (input.type === "matching") {
    const pairs = getMatchingPairs(input.answerConfig);
    if (pairs.length < 2) return "Câu ghép nối cần tối thiểu hai cặp trái–phải hợp lệ.";
  }
  if (input.type === "ordering") {
    const items = getOrderingItems(input.answerConfig);
    if (items.length < 2 || items.length > 10 || new Set(items.map(item => item.id)).size !== items.length) return "Câu sắp xếp cần từ hai đến mười mục có mã riêng và nội dung hợp lệ.";
  }
  if (input.type === "hotspot") {
    if (!input.imageUrl?.trim()) return "Câu Hotspot cần có ảnh nền.";
    if (!getHotspots(input.answerConfig).length) return "Câu Hotspot cần ít nhất một vị trí đáp án hợp lệ.";
  }
  if (["essay", "essay_ai"].includes(input.type)) {
    const sampleOutline = input.answerConfig?.sampleOutline;
    if (typeof sampleOutline !== "string" || !sampleOutline.trim()) return "Câu tự luận cần có dàn ý hoặc đáp án mẫu.";
  }
  return undefined;
}
