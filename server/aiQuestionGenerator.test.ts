import { describe, expect, it } from "vitest";
import { parseAiQuestionDraft } from "./aiQuestionGenerator";

describe("AI question draft validation", () => {
  it("chấp nhận bản nháp một đáp án có cấu trúc hợp lệ", () => {
    expect(parseAiQuestionDraft(JSON.stringify({ prompt: "Thủ đô của Việt Nam là thành phố nào?", explanation: "Hà Nội là thủ đô Việt Nam.", options: [{ body: "Hà Nội", isCorrect: true }, { body: "Huế", isCorrect: false }], answerConfig: {} }), "single").options[0]).toMatchObject({ isCorrect: true });
  });

  it("từ chối bản nháp không có cấu hình đáp án hợp lệ", () => {
    expect(() => parseAiQuestionDraft(JSON.stringify({ prompt: "Điền từ còn thiếu trong câu này.", explanation: "Cần có đáp án chấp nhận.", options: [], answerConfig: {} }), "fill_blank")).toThrow();
  });
});
