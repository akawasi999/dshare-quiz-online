export type QuestionAnswerKey = {
  questionId: number;
  optionIds: number[];
  correctOptionIds: number[];
  points: number;
};

export type SubmittedAnswer = {
  questionId: number;
  selectedOptionIds: number[];
};

export type ScoreSummary = {
  earnedPoints: number;
  availablePoints: number;
  scorePercent: number;
  correctCount: number;
  answerResults: Array<{ questionId: number; isCorrect: boolean }>;
};

const normalized = (values: number[]) => Array.from(new Set(values)).sort((a, b) => a - b);

export function areSameSelections(left: number[], right: number[]) {
  const a = normalized(left);
  const b = normalized(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function scoreQuiz(
  answerKey: QuestionAnswerKey[],
  submittedAnswers: SubmittedAnswer[]
): ScoreSummary {
  const submittedMap = new Map(
    submittedAnswers.map(answer => [answer.questionId, answer.selectedOptionIds])
  );
  let earnedPoints = 0;
  let correctCount = 0;

  const answerResults = answerKey.map(question => {
    const isCorrect = areSameSelections(
      submittedMap.get(question.questionId) ?? [],
      question.correctOptionIds
    );
    if (isCorrect) {
      earnedPoints += question.points;
      correctCount += 1;
    }
    return { questionId: question.questionId, isCorrect };
  });

  const availablePoints = answerKey.reduce((sum, question) => sum + question.points, 0);
  return {
    earnedPoints,
    availablePoints,
    scorePercent: availablePoints === 0 ? 0 : Math.round((earnedPoints / availablePoints) * 100),
    correctCount,
    answerResults,
  };
}

/** Deterministic Fisher-Yates shuffle so a saved attempt keeps one stable order. */
export function shuffledForAttempt<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = Math.abs(seed) || 1;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
