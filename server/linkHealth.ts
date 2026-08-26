export type RouteErrorEvent = {
  id: number;
  path: string;
  referrerPath: string | null;
  occurredAt: Date;
};

export const normalizeInternalPath = (value: string) => {
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.length > 512) return null;
  try {
    const url = new URL(candidate, "https://dshare.local");
    return url.pathname || "/";
  } catch {
    return null;
  }
};

export function summarizeLinkHealth(events: RouteErrorEvent[], now = new Date()) {
  const since24Hours = now.getTime() - 24 * 60 * 60 * 1000;
  const since7Days = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const byPath = new Map<string, { count: number; lastSeenAt: Date }>();
  for (const event of events) {
    const current = byPath.get(event.path);
    if (!current) byPath.set(event.path, { count: 1, lastSeenAt: event.occurredAt });
    else {
      current.count += 1;
      if (event.occurredAt > current.lastSeenAt) current.lastSeenAt = event.occurredAt;
    }
  }
  const topPaths = Array.from(byPath.entries())
    .map(([path, stats]) => ({ path, ...stats }))
    .sort((a, b) => b.count - a.count || b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
    .slice(0, 8);
  return {
    eventsLast24h: events.filter(event => event.occurredAt.getTime() >= since24Hours).length,
    eventsLast7d: events.filter(event => event.occurredAt.getTime() >= since7Days).length,
    uniquePaths: byPath.size,
    topPaths,
    recent: events.slice(0, 12),
    refreshedAt: now,
  };
}
