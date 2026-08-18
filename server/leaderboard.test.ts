import { describe, expect, it } from "vitest";
import { sortLeaderboardEntries } from "./leaderboard";

describe("leaderboard ordering", () => {
  it("xếp theo điểm cao nhất, sau đó số lượt hoàn thành và mã học viên ổn định", () => {
    const entries = [
      { userId: 8, bestScore: 88, completedCount: 4 },
      { userId: 5, bestScore: 92, completedCount: 1 },
      { userId: 3, bestScore: 88, completedCount: 6 },
      { userId: 2, bestScore: 88, completedCount: 6 },
    ];
    expect(sortLeaderboardEntries(entries).map(entry => entry.userId)).toEqual([5, 2, 3, 8]);
    expect(entries.map(entry => entry.userId)).toEqual([8, 5, 3, 2]);
  });
});
