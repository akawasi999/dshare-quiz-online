export const QUIZ_NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function isQuizNew(createdAt: Date | string | number | undefined, now = Date.now()) {
  if (!createdAt) return false;
  const publishedAt = new Date(createdAt).getTime();
  return Number.isFinite(publishedAt) && publishedAt <= now && now - publishedAt <= QUIZ_NEW_WINDOW_MS;
}

function getPublishedAt(createdAt: Date | string | number | undefined) {
  const value = createdAt ? new Date(createdAt).getTime() : Number.NaN;
  return Number.isFinite(value) ? value : null;
}

export function formatRelativePublicationTime(createdAt: Date | string | number | undefined, now = Date.now()) {
  const publishedAt = getPublishedAt(createdAt);
  if (publishedAt === null || publishedAt > now) return null;
  const difference = now - publishedAt;
  if (difference < 60_000) return "Vừa công bố";
  if (difference < 3_600_000) return `${Math.floor(difference / 60_000)} phút trước`;
  if (difference < 86_400_000) return `${Math.floor(difference / 3_600_000)} giờ trước`;
  if (difference < 30 * 86_400_000) return `${Math.floor(difference / 86_400_000)} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(publishedAt));
}

export function formatPublicationDateTime(createdAt: Date | string | number | undefined) {
  const publishedAt = getPublishedAt(createdAt);
  if (publishedAt === null) return null;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" }).format(new Date(publishedAt));
}
