export const QUIZ_NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function isQuizNew(createdAt: Date | string | number | undefined, now = Date.now()) {
  if (!createdAt) return false;
  const publishedAt = new Date(createdAt).getTime();
  return Number.isFinite(publishedAt) && publishedAt <= now && now - publishedAt <= QUIZ_NEW_WINDOW_MS;
}
