import { describe, expect, it } from "vitest";
import { validateQuestionConfiguration } from "../shared/questionValidation";

describe("question configuration validation", () => {
  it("buộc câu nhiều đáp án phải có ít nhất hai lựa chọn đúng", () => {
    expect(validateQuestionConfiguration({ type: "multiple", options: [{ body: "A", isCorrect: true }, { body: "B", isCorrect: false }] })).toContain("tối thiểu hai");
    expect(validateQuestionConfiguration({ type: "multiple", options: [{ body: "A", isCorrect: true }, { body: "B", isCorrect: true }] })).toBeUndefined();
  });

  it("kiểm tra cấu hình riêng cho điền từ, hình ảnh và ghép nối", () => {
    expect(validateQuestionConfiguration({ type: "fill_blank", options: [], answerConfig: {} })).toContain("đáp án được chấp nhận");
    expect(validateQuestionConfiguration({ type: "image", imageUrl: "", options: [{ body: "A", isCorrect: true }, { body: "B", isCorrect: false }] })).toContain("URL hình");
    expect(validateQuestionConfiguration({ type: "matching", options: [], answerConfig: { pairs: [{ left: "A", right: "1" }] } })).toContain("tối thiểu hai cặp");
  });

  it("yêu cầu dàn ý đáp án mẫu cho câu tự luận", () => {
    expect(validateQuestionConfiguration({ type: "essay", options: [], answerConfig: {} })).toContain("dàn ý");
    expect(validateQuestionConfiguration({ type: "essay", options: [], answerConfig: { sampleOutline: "Nêu luận điểm, dẫn chứng và kết luận." } })).toBeUndefined();
  });

  it("yêu cầu ít nhất hai nhận định Có/Không hợp lệ", () => {
    expect(validateQuestionConfiguration({ type: "true_false_statements", options: [], answerConfig: { statements: [{ id: "a", text: "Nhận định hợp lệ", correct: true }] } })).toContain("hai đến tám");
    expect(validateQuestionConfiguration({ type: "true_false_statements", options: [], answerConfig: { statements: [{ id: "a", text: "Mệnh đề thứ nhất", correct: true }, { id: "b", text: "Mệnh đề thứ hai", correct: false }] } })).toBeUndefined();
  });
});
