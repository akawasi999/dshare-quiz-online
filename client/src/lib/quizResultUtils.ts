export type StoredQuizResult = {
  scorePercent: number;
  correctCount: number;
  availablePoints: number;
  earnedPoints: number;
  passed: boolean;
  durationSeconds?: number;
  totalDurationSeconds?: number;
  quiz: { title: string; completionReward?: number; passingScore: number };
  review: Array<{ questionId: number; prompt: string; explanation?: string | null; selectedOptionIds: number[]; correctOptionIds: number[]; isCorrect: boolean; options: { id: number; body: string }[] }>;
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
