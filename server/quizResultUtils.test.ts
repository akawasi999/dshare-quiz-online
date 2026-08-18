import { describe, expect, it } from "vitest";
import { parseStoredQuizResult } from "../client/src/lib/quizResultUtils";

describe("stored quiz result", () => {
  const valid = JSON.stringify({ scorePercent: 80, correctCount: 4, availablePoints: 5, earnedPoints: 4, passed: true, quiz: { title: "Đề mẫu", passingScore: 70 }, review: [] });
  it("chấp nhận payload kết quả hợp lệ", () => expect(parseStoredQuizResult(valid)?.quiz.title).toBe("Đề mẫu"));
  it("không làm hỏng màn hình với storage rỗng, JSON lỗi hoặc payload thiếu trường", () => {
    expect(parseStoredQuizResult(null)).toBeNull();
    expect(parseStoredQuizResult("{")).toBeNull();
    expect(parseStoredQuizResult(JSON.stringify({ scorePercent: 80 }))).toBeNull();
  });
});
