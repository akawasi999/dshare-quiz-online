import { describe, expect, it } from "vitest";
import { withTrendingStatus } from "../shared/quizTrending";

describe("withTrendingStatus", () => {
  it("đánh dấu mọi bộ đề đồng hạng có lượt làm cao nhất trong 24 giờ", () => {
    expect(withTrendingStatus([{ recentAttemptCount: 2 }, { recentAttemptCount: 5 }, { recentAttemptCount: 5 }]).map(item => item.isTrending)).toEqual([false, true, true]);
  });

  it("không đánh dấu thịnh hành khi chưa có lượt làm trong 24 giờ", () => {
    expect(withTrendingStatus([{ recentAttemptCount: 0 }, {}]).map(item => item.isTrending)).toEqual([false, false]);
  });
});
