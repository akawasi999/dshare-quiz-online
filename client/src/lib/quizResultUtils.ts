export type StoredQuizResult = {
  scorePercent: number;
  correctCount: number;
  availablePoints: number;
  earnedPoints: number;
  passed: boolean;
  durationSeconds?: number;
  totalDurationSeconds?: number;
  quiz: { title: string; completionReward?: number; passingScore: number };
  review: Array<{ questionId: number; prompt: string; explanation?: string | null; type?: string; selectedOptionIds: number[]; correctOptionIds: number[]; selectedStatementAnswers?: Record<string, boolean>; statements?: Array<{ id: string; text: string; correct: boolean }>; matchingPairs?: Array<{ left: string; right: string }>; selectedMatchingAnswers?: Record<string, string>; selectedTextAnswer?: string; acceptedAnswers?: string[]; sampleOutline?: string; isCorrect: boolean; options: { id: number; body: string }[] }>;
};

export function parseStoredQuizResult(raw: string | null): StoredQuizResult | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredQuizResult>;
    if (typeof value.scorePercent !== "number" || typeof value.passed !== "boolean" || !value.quiz || !Array.isArray(value.review)) return null;
    return value as StoredQuizResult;
  } catch {
    return null;
  }
}
