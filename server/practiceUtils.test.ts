import { describe, expect, it } from "vitest";
import {
  getPracticeMatchingPairs,
  haveSameSelectedOptions,
  isPracticeTextAnswerCorrect,
  shufflePracticeOptions,
} from "../client/src/lib/practiceUtils";

describe("practice utilities", () => {
  it("chấm câu điền từ không phân biệt hoa thường và khoảng trắng", () => {
    expect(isPracticeTextAnswerCorrect({ acceptedAnswers: ["Dshare Quiz", "DShare"] }, "  dshare   quiz ")).toBe(true);
    expect(isPracticeTextAnswerCorrect({ correctAnswer: "Đúng" }, "sai")).toBe(false);
  });

  it("chỉ coi câu nhiều đáp án là đúng khi tập lựa chọn trùng hoàn toàn", () => {
    expect(haveSameSelectedOptions([2, 5], [5, 2])).toBe(true);
    expect(haveSameSelectedOptions([2], [2, 5])).toBe(false);
    expect(haveSameSelectedOptions([2, 5, 5], [2, 5])).toBe(false);
  });

  it("đọc cặp ghép nối hợp lệ và xáo trộn phương án mà không đổi dữ liệu nguồn", () => {
    const pairs = getPracticeMatchingPairs({ pairs: [{ left: "A", right: "1" }, { left: "B", right: "2" }, { left: "", right: "3" }] });
    const values = ["1", "2", "3"];
    expect(pairs).toEqual([{ left: "A", right: "1" }, { left: "B", right: "2" }]);
    expect(shufflePracticeOptions(values, () => 0)).toEqual(["2", "3", "1"]);
    expect(values).toEqual(["1", "2", "3"]);
  });
});
