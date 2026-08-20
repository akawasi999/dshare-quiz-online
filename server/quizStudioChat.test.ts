import { describe, expect, it } from "vitest";
import { buildQuizStudioChatMessages, parseQuizStudioChatResponse } from "./quizStudioChat";

describe("quizStudioChat", () => {
  it("hướng AI làm rõ khi đề bài chưa đủ và gắn ngữ cảnh Studio", () => {
    const messages = buildQuizStudioChatMessages({ messages: [{ role: "user", content: "Tạo vài câu hỏi" }], context: { title: "Ôn tập Toán", currentQuestionCount: 2 } });
    expect(messages[0].content).toContain("action=\"clarify\"");
    expect(messages[0].content).toContain("Tên Quiz: Ôn tập Toán");
  });

  it("xác thực câu hỏi AI trả về trước khi thêm vào bản nháp", () => {
    const result = parseQuizStudioChatResponse({ action: "generate", reply: "Đã tạo câu hỏi.", detected: { topic: "Phân số", type: "single", difficulty: "easy", count: 1 }, suggestedPrompts: [], questions: [{ type: "single", difficulty: "easy", prompt: "Phân số nào bằng một phần hai?", explanation: "2/4 rút gọn bằng 1/2.", options: [{ body: "2/4", isCorrect: true }, { body: "1/4", isCorrect: false }], answerConfig: {} }] });
    expect(result.questions[0]?.options.find(option => option.isCorrect)?.body).toBe("2/4");
  });
});
