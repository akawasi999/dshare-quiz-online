export type QuotaTier = "basic" | "pro" | "premium";

export type MembershipQuota = {
  attemptsPerMonth: number | null;
  quizzesPerMonth: number | null;
  aiCreditsPerMonth: number | null;
};

export const membershipQuotas: Record<QuotaTier, MembershipQuota> = {
  basic: { attemptsPerMonth: 20, quizzesPerMonth: 2, aiCreditsPerMonth: 20 },
  pro: { attemptsPerMonth: 40, quizzesPerMonth: 20, aiCreditsPerMonth: 40 },
  premium: { attemptsPerMonth: null, quizzesPerMonth: 50, aiCreditsPerMonth: 50 },
};

export function getQuotaPeriod(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function hasReachedQuota(used: number, limit: number | null) {
  return limit !== null && used >= limit;
}

export function quotaLabel(limit: number | null) {
  return limit === null ? "không giới hạn" : `${limit}/tháng`;
}
