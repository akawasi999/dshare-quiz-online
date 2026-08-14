import { describe, expect, it } from "vitest";
import { areSameSelections, scoreQuiz, shuffledForAttempt } from "./quizEngine";

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

  it("keeps a deterministic but non-mutating shuffled order", () => {
    const source = [1, 2, 3, 4, 5];
    expect(shuffledForAttempt(source, 43)).toEqual(shuffledForAttempt(source, 43));
    expect(source).toEqual([1, 2, 3, 4, 5]);
  });
});
