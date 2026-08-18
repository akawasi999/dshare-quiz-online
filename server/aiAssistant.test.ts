import { describe, expect, it } from "vitest";
import { buildQuizAssistantMessages } from "./aiAssistant";

describe("quiz AI assistant prompts", () => {
  it("đóng gói đúng ngữ cảnh đã được hệ thống xác nhận cho lời giải", () => {
    const messages = buildQuizAssistantMessages({
      intent: "explain",
      prompt: "Biểu thức nào đúng?",
      explanation: "Áp dụng quy tắc biến đổi.",
      options: [{ body: "A", isCorrect: false }, { body: "B", isCorrect: true }],
    });
    expect(messages[1].content).toContain("Đáp án đúng do hệ thống xác nhận: B");
    expect(messages[1].content).toContain("Giải thích theo từng bước suy luận");
  });

  it("giữ câu hỏi tiếp nối trong phạm vi quiz và không yêu cầu bịa nguồn", () => {
    const messages = buildQuizAssistantMessages({
      intent: "follow_up",
      prompt: "Khái niệm chính là gì?",
      explanation: null,
      options: [],
      followUp: "Vì sao đáp án này phù hợp?",
    });
    expect(messages[0].content).toContain("không bịa thông tin");
    expect(messages[1].content).toContain("Vì sao đáp án này phù hợp?");
  });
});
