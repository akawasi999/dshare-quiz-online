export type PracticeMatchingPair = { left: string; right: string };

export function normalizePracticeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
}

export function isPracticeTextAnswerCorrect(answerConfig: Record<string, unknown> | null | undefined, answer: string) {
  const rawAnswers = answerConfig?.acceptedAnswers ?? answerConfig?.correctAnswer;
  const acceptedAnswers = Array.isArray(rawAnswers) ? rawAnswers : rawAnswers ? [rawAnswers] : [];
  const normalizedAnswer = normalizePracticeAnswer(answer);
  return acceptedAnswers.some(value => typeof value === "string" && normalizePracticeAnswer(value) === normalizedAnswer);
}

export function getPracticeMatchingPairs(answerConfig: Record<string, unknown> | null | undefined): PracticeMatchingPair[] {
  const rawPairs = answerConfig?.pairs;
  if (!Array.isArray(rawPairs)) return [];
  return rawPairs.flatMap(pair => {
    if (!pair || typeof pair !== "object") return [];
    const candidate = pair as Record<string, unknown>;
    return typeof candidate.left === "string" && typeof candidate.right === "string" && candidate.left.trim() && candidate.right.trim()
      ? [{ left: candidate.left, right: candidate.right }]
      : [];
  });
}

export function haveSameSelectedOptions(selectedOptionIds: number[], correctOptionIds: number[]) {
  if (selectedOptionIds.length !== correctOptionIds.length) return false;
  const selected = new Set(selectedOptionIds);
  return selected.size === correctOptionIds.length && correctOptionIds.every(optionId => selected.has(optionId));
}

export function isPracticeOptionAnswerCorrect(selectedOptionIds: number[], correctOptionIds: number[]) {
  return haveSameSelectedOptions(selectedOptionIds, correctOptionIds);
}

export function isPracticeMatchingPairCorrect(candidate: string, expected: string) {
  return normalizePracticeAnswer(candidate) === normalizePracticeAnswer(expected);
}

export function shufflePracticeOptions<T>(values: T[], random: () => number = Math.random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export type PracticeTransition = "next-matching-pair" | "next-question" | "complete-session";

export function getPracticeTransition(input: { questionIndex: number; questionCount: number; matchingIndex?: number; matchingCount?: number }): PracticeTransition {
  if ((input.matchingCount ?? 0) > 0 && (input.matchingIndex ?? 0) < (input.matchingCount ?? 0) - 1) return "next-matching-pair";
  return input.questionIndex < input.questionCount - 1 ? "next-question" : "complete-session";
}

export const practiceCompletionDestination = "/quiz";
