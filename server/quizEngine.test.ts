import { describe, expect, it } from "vitest";
import { areSameMatchingSelections, areSameOrderingSelections, areSameSelections, areSameStatementSelections, isAcceptedTextAnswer, scoreQuiz, shuffledForAttempt } from "./quizEngine";

describe("quiz scoring engine", () => {
  it("requires the exact set of options for a multi-choice answer", () => {
    expect(areSameSelections([3, 1], [1, 3])).toBe(true);
    expect(areSameSelections([1], [1, 3])).toBe(false);
    expect(areSameSelections([1, 1, 3], [1, 3])).toBe(true);
  });

  it("calculates weighted scores and correct count", () => {
    const result = scoreQuiz(
      [
        { questionId: 1, optionIds: [1, 2], correctOptionIds: [2], points: 2 },
        { questionId: 2, optionIds: [3, 4, 5], correctOptionIds: [3, 5], points: 3 },
      ],
      [
        { questionId: 1, selectedOptionIds: [2] },
        { questionId: 2, selectedOptionIds: [3] },
      ]
    );

    expect(result).toMatchObject({ earnedPoints: 2, availablePoints: 5, scorePercent: 40, correctCount: 1 });
  });

  it("chấm đúng khi mọi nhận định Có/Không khớp và không cho điểm từng phần", () => {
    const answerKey = { s1: true, s2: false, s3: true };
    expect(areSameStatementSelections(answerKey, { statementAnswers: answerKey })).toBe(true);
    expect(areSameStatementSelections(answerKey, { statementAnswers: { s1: true, s2: true, s3: true } })).toBe(false);
    const result = scoreQuiz([{ questionId: 7, optionIds: [], correctOptionIds: [], type: "true_false_statements", statementAnswers: answerKey, points: 4 }], [{ questionId: 7, selectedOptionIds: [], answerPayload: { statementAnswers: { s1: true, s2: true, s3: true } } }]);
    expect(result).toMatchObject({ earnedPoints: 0, availablePoints: 4, correctCount: 0 });
  });

  it("chấm Ghép nối và điền từ theo answerPayload đã lưu", () => {
    const pairs = [{ left: "Hà Nội", right: "Việt Nam" }, { left: "Tokyo", right: "Nhật Bản" }];
    expect(areSameMatchingSelections(pairs, { matchingAnswers: { 0: "Việt Nam", 1: "Nhật Bản" } })).toBe(true);
    expect(areSameMatchingSelections(pairs, { matchingAnswers: { 0: "Nhật Bản", 1: "Việt Nam" } })).toBe(false);
    expect(isAcceptedTextAnswer(["Dshare Quiz", "Dshare"], { textAnswer: "  dshare   quiz " })).toBe(true);
    const result = scoreQuiz(
      [
        { questionId: 8, optionIds: [], correctOptionIds: [], type: "matching", matchingPairs: pairs, points: 2 },
        { questionId: 9, optionIds: [], correctOptionIds: [], type: "fill_blank", acceptedAnswers: ["Dshare Quiz"], points: 3 },
      ],
      [
        { questionId: 8, selectedOptionIds: [], answerPayload: { matchingAnswers: { 0: "Việt Nam", 1: "Nhật Bản" } } },
        { questionId: 9, selectedOptionIds: [], answerPayload: { textAnswer: "dshare quiz" } },
      ],
    );
    expect(result).toMatchObject({ earnedPoints: 5, availablePoints: 5, scorePercent: 100, correctCount: 2 });
  });

  it("chấm chính xác trình tự và điền từ", () => {
    const orderingItems = [{ id: "a", text: "Bước 1" }, { id: "b", text: "Bước 2" }];
    expect(areSameOrderingSelections(orderingItems, { orderingIds: ["a", "b"] })).toBe(true);
    expect(areSameOrderingSelections(orderingItems, { orderingIds: ["b", "a"] })).toBe(false);
    const result = scoreQuiz([
      { questionId: 10, optionIds: [], correctOptionIds: [], type: "ordering", orderingItems, points: 2 },
      { questionId: 11, optionIds: [], correctOptionIds: [], type: "fill_blank", acceptedAnswers: ["Trí tuệ nhân tạo"], points: 1 },
    ], [
      { questionId: 10, selectedOptionIds: [], answerPayload: { orderingIds: ["a", "b"] } },
      { questionId: 11, selectedOptionIds: [], answerPayload: { textAnswer: "trí tuệ   nhân tạo" } },
    ]);
    expect(result).toMatchObject({ earnedPoints: 3, availablePoints: 3, correctCount: 2 });
  });

  it("keeps a deterministic but non-mutating shuffled order", () => {
    const source = [1, 2, 3, 4, 5];
    expect(shuffledForAttempt(source, 43)).toEqual(shuffledForAttempt(source, 43));
    expect(source).toEqual([1, 2, 3, 4, 5]);
  });
});
