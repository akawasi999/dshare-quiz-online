import { describe, expect, it } from "vitest";
import {
  getPracticeMatchingPairs,
  getPracticeTransition,
  haveSameSelectedOptions,
  isPracticeMatchingPairCorrect,
  isPracticeOptionAnswerCorrect,
  isPracticeTextAnswerCorrect,
  practiceCompletionDestination,
  shufflePracticeOptions,
} from "../client/src/lib/practiceUtils";

describe("practice utilities", () => {
  it("chấm câu điền từ không phân biệt hoa thường và khoảng trắng", () => {
    expect(isPracticeTextAnswerCorrect({ acceptedAnswers: ["Dshare Quiz", "DShare"] }, "  dshare   quiz ")).toBe(true);
    expect(isPracticeTextAnswerCorrect({ acceptedAnswers: ["Python", "Py"] }, "py")).toBe(true);
    expect(isPracticeTextAnswerCorrect({ correctAnswer: "Đúng" }, "sai")).toBe(false);
    expect(isPracticeTextAnswerCorrect({}, "bất kỳ")).toBe(false);
  });

  it("chỉ coi câu nhiều đáp án là đúng khi tập lựa chọn trùng hoàn toàn", () => {
    expect(haveSameSelectedOptions([2, 5], [5, 2])).toBe(true);
    expect(haveSameSelectedOptions([2], [2, 5])).toBe(false);
    expect(haveSameSelectedOptions([2, 5, 5], [2, 5])).toBe(false);
    expect(haveSameSelectedOptions([], [])).toBe(true);
  });

  it("chấm nhất quán single, đúng/sai và câu ảnh theo đáp án lựa chọn", () => {
    expect(isPracticeOptionAnswerCorrect([1], [1])).toBe(true);
    expect(isPracticeOptionAnswerCorrect([1], [2])).toBe(false);
    expect(isPracticeOptionAnswerCorrect([7], [7])).toBe(true);
    expect(isPracticeOptionAnswerCorrect([4], [4])).toBe(true);
    expect(isPracticeOptionAnswerCorrect([], [4])).toBe(false);
  });

  it("đọc cặp ghép nối hợp lệ và xáo trộn phương án mà không đổi dữ liệu nguồn", () => {
    const pairs = getPracticeMatchingPairs({ pairs: [{ left: "A", right: "1" }, { left: "B", right: "2" }, { left: "", right: "3" }] });
    const values = ["1", "2", "3"];
    expect(pairs).toEqual([{ left: "A", right: "1" }, { left: "B", right: "2" }]);
    expect(getPracticeMatchingPairs({ pairs: [null, { left: "A", right: 1 }] })).toEqual([]);
    expect(shufflePracticeOptions(values, () => 0)).toEqual(["2", "3", "1"]);
    expect(values).toEqual(["1", "2", "3"]);
    expect(isPracticeMatchingPairCorrect("  Hà Nội ", "hà   nội")).toBe(true);
    expect(isPracticeMatchingPairCorrect("Huế", "Đà Nẵng")).toBe(false);
  });

  it("xác định đúng bước điều hướng giữa các cặp, câu hỏi và khi hoàn tất", () => {
    expect(getPracticeTransition({ questionIndex: 0, questionCount: 2, matchingIndex: 0, matchingCount: 2 })).toBe("next-matching-pair");
    expect(getPracticeTransition({ questionIndex: 0, questionCount: 2, matchingIndex: 1, matchingCount: 2 })).toBe("next-question");
    expect(getPracticeTransition({ questionIndex: 1, questionCount: 2 })).toBe("complete-session");
    expect(getPracticeTransition({ questionIndex: 0, questionCount: 1, matchingCount: 0 })).toBe("complete-session");
    expect(getPracticeTransition({ questionIndex: 0, questionCount: 0 })).toBe("complete-session");
    expect(practiceCompletionDestination).toBe("/explore");
  });
});
