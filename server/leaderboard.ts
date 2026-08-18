export type LeaderboardEntry = {
  userId: number;
  bestScore: number;
  completedCount: number;
};

export function compareLeaderboardEntries(left: LeaderboardEntry, right: LeaderboardEntry) {
  return right.bestScore - left.bestScore || right.completedCount - left.completedCount || left.userId - right.userId;
}

export function sortLeaderboardEntries<T extends LeaderboardEntry>(entries: T[]) {
  return [...entries].sort(compareLeaderboardEntries);
}
