import { describe, expect, it } from "vitest";
import { buildQuestionEnhancementMessages, buildQuizStudioChatMessages, parseQuestionEnhancement, parseQuizStudioChatResponse } from "./quizStudioChat";

const singleDraft = {
  type: "single" as const,
  difficulty: "easy" as const,
  points: 2,
  prompt: "Phân số nào bằng một phần hai?",
  explanation: "2/4 rút gọn bằng 1/2.",
  imageUrl: "",
  options: [{ body: "2/4", isCorrect: true }, { body: "1/4", isCorrect: false }],
  answerConfig: {},
};

describe("quizStudioChat", () => {
  it("hướng AI luôn hỏi số lượng tối đa trước khi tạo và gắn ngữ cảnh Studio", () => {
    const messages = buildQuizStudioChatMessages({ messages: [{ role: "user", content: "Tạo vài câu hỏi" }], context: { title: "Ôn tập Toán", currentQuestionCount: 2 } });
    expect(messages[0].content).toContain('"clarify_count"');
    expect(messages[0].content).toContain("Tên Quiz: Ôn tập Toán");
    expect(messages[0].content).toContain("CHƯA xác nhận số lượng");
  });

  it("không áp dụng thao tác khi AI đang chờ người tạo xác nhận số lượng", () => {
    const result = parseQuizStudioChatResponse({ action: "clarify_count", reply: "Bạn muốn tạo tối đa bao nhiêu câu hỏi?", detected: { topic: "Phân số", type: "single", difficulty: "easy", count: 4 }, suggestedPrompts: ["Tạo tối đa 4 câu"], operations: [] });
    expect(result.operations).toEqual([]);
    expect(result.detected.count).toBe(4);
  });

  it("xác thực và chuẩn hóa lệnh AI thêm, sửa, xoá trước khi áp dụng vào bản nháp", () => {
    const result = parseQuizStudioChatResponse({ action: "apply", reply: "Đã cập nhật bản nháp.", detected: { topic: "Phân số", type: "single", difficulty: "easy", count: 1 }, suggestedPrompts: [], operations: [{ kind: "create", targetId: null, question: singleDraft }, { kind: "update", targetId: "q-1", question: { ...singleDraft, points: 5, prompt: "Phân số nào tương đương 1/2?" } }, { kind: "delete", targetId: "q-2", question: null }] });
    expect(result.operations).toHaveLength(3);
    expect(result.operations[0]?.question?.options.find(option => option.isCorrect)?.body).toBe("2/4");
    expect(result.operations[1]?.question?.points).toBe(5);
    expect(result.operations[2]).toMatchObject({ kind: "delete", targetId: "q-2", question: null });
  });

  it("tạo hướng dẫn đúng cho công cụ lời giải và giữ cấu trúc câu hỏi khi AI phản hồi", () => {
    const messages = buildQuestionEnhancementMessages({ action: "explain", question: { type: "single", difficulty: "medium", prompt: "2 + 2 bằng bao nhiêu?", explanation: "", options: [{ body: "4", isCorrect: true }, { body: "5", isCorrect: false }], answerConfig: {} } });
    expect(messages[0].content).toContain("Tạo lời giải chi tiết");
    const result = parseQuestionEnhancement({ action: "explain", prompt: "2 + 2 bằng bao nhiêu?", explanation: "Cộng hai đơn vị với hai đơn vị được 4.", options: [{ body: "4", isCorrect: true }, { body: "5", isCorrect: false }], answerConfig: {} }, "single");
    expect(result.explanation).toContain("được 4");
  });
});
