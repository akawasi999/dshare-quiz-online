import { describe, expect, it } from "vitest";
import { parseStoredQuizResult } from "../client/src/lib/quizResultUtils";

describe("stored quiz result", () => {
  const valid = JSON.stringify({ scorePercent: 80, correctCount: 4, availablePoints: 5, earnedPoints: 4, passed: true, quiz: { title: "Đề mẫu", passingScore: 70 }, review: [] });
  it("chấp nhận payload kết quả hợp lệ", () => expect(parseStoredQuizResult(valid)?.quiz.title).toBe("Đề mẫu"));
  it("giữ nguyên dữ liệu review của các loại câu hỏi không dùng lựa chọn", () => {
    const result = parseStoredQuizResult(JSON.stringify({ scorePercent: 50, correctCount: 1, availablePoints: 2, earnedPoints: 1, passed: false, quiz: { title: "Đề tổng hợp", passingScore: 70 }, review: [{ questionId: 1, prompt: "Ghép nối", type: "matching", selectedOptionIds: [], correctOptionIds: [], matchingPairs: [{ left: "A", right: "1" }], selectedMatchingAnswers: { 0: "1" }, isCorrect: true, options: [] }, { questionId: 2, prompt: "Điền từ", type: "fill_blank", selectedOptionIds: [], correctOptionIds: [], selectedTextAnswer: "Dshare Quiz", acceptedAnswers: ["Dshare Quiz"], sampleOutline: "", isCorrect: false, options: [] }] }));
    expect(result?.review[0].selectedMatchingAnswers).toEqual({ 0: "1" });
    expect(result?.review[1].acceptedAnswers).toEqual(["Dshare Quiz"]);
  });
  it("không làm hỏng màn hình với storage rỗng, JSON lỗi hoặc payload thiếu trường", () => {
    expect(parseStoredQuizResult(null)).toBeNull();
    expect(parseStoredQuizResult("{")).toBeNull();
    expect(parseStoredQuizResult(JSON.stringify({ scorePercent: 80 }))).toBeNull();
  });
});
