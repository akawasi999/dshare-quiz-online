import { describe, expect, it } from "vitest";
import { areSameSelections, areSameStatementSelections, scoreQuiz, shuffledForAttempt } from "./quizEngine";

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

  it("keeps a deterministic but non-mutating shuffled order", () => {
    const source = [1, 2, 3, 4, 5];
    expect(shuffledForAttempt(source, 43)).toEqual(shuffledForAttempt(source, 43));
    expect(source).toEqual([1, 2, 3, 4, 5]);
  });
});
