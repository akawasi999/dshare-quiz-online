export type RecentAttemptQuiz = { recentAttemptCount?: number };

export function withTrendingStatus<T extends RecentAttemptQuiz>(quizzes: T[]) {
  const highestRecentAttemptCount = Math.max(0, ...quizzes.map(quiz => quiz.recentAttemptCount ?? 0));
  return quizzes.map(quiz => ({ ...quiz, isTrending: highestRecentAttemptCount > 0 && (quiz.recentAttemptCount ?? 0) === highestRecentAttemptCount }));
}
