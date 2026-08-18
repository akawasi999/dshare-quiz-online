import { describe, expect, it } from "vitest";
import { createLeaderboardInput, getLeaderboardHeading } from "../client/src/lib/leaderboardUtils";

describe("leaderboard scope utilities", () => {
  it("chỉ gửi quizId khi người học chọn phạm vi bộ đề hợp lệ", () => {
    expect(createLeaderboardInput("all", 3)).toBeUndefined();
    expect(createLeaderboardInput("quiz", null)).toBeUndefined();
    expect(createLeaderboardInput("quiz", 3)).toEqual({ quizId: 3 });
  });

  it("hiển thị nhãn phạm vi rõ ràng cho toàn hệ thống và từng bộ đề", () => {
    expect(getLeaderboardHeading("all", "Python cơ bản")).toBe("Toàn hệ thống");
    expect(getLeaderboardHeading("quiz", "Python cơ bản")).toBe("Python cơ bản");
    expect(getLeaderboardHeading("quiz")).toBe("Bộ đề đang chọn");
  });
});
