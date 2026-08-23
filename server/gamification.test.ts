import { describe, expect, it } from "vitest";
import { getGamificationDayKey, getMissionPeriod } from "./gamification";

describe("Gamification mission periods", () => {
  it("tạo period hằng ngày theo UTC và hết hạn vào ngày kế tiếp", () => {
    const period = getMissionPeriod("daily", 8, new Date("2026-08-23T18:45:00.000Z"));
    expect(period.key).toBe("2026-08-23");
    expect(period.expiresAt.toISOString()).toBe("2026-08-24T00:00:00.000Z");
  });

  it("neo period tuần vào Thứ Hai UTC để không sinh nhiệm vụ trùng", () => {
    const period = getMissionPeriod("weekly", 8, new Date("2026-08-23T18:45:00.000Z"));
    expect(period.key).toBe("2026-08-17-w");
    expect(period.expiresAt.toISOString()).toBe("2026-08-24T00:00:00.000Z");
  });

  it("giữ period đặc biệt riêng cho từng định nghĩa mission", () => {
    const period = getMissionPeriod("special", 42, new Date("2026-08-23T18:45:00.000Z"));
    expect(period.key).toBe("special-42");
    expect(getGamificationDayKey(new Date("2026-08-23T18:45:00.000Z"))).toBe("2026-08-23");
  });
});
