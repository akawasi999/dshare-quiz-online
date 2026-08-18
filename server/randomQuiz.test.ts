import { describe, expect, it } from "vitest";
import { allocateQuestionCounts } from "./randomQuiz";

describe("random quiz difficulty allocation", () => {
  it("phân bổ đúng số câu cho tỷ lệ nguyên", () => {
    expect(allocateQuestionCounts(20, { easy: 0.4, medium: 0.4, hard: 0.2 })).toEqual({ easy: 8, medium: 8, hard: 4 });
  });

  it("giữ tổng số câu và ưu tiên phần dư tỷ lệ lớn hơn một cách ổn định", () => {
    const allocation = allocateQuestionCounts(7, { easy: 0.34, medium: 0.33, hard: 0.33 });
    expect(allocation).toEqual({ easy: 3, medium: 2, hard: 2 });
    expect(allocation.easy + allocation.medium + allocation.hard).toBe(7);
  });
});
