import { describe, expect, it } from "vitest";
import { canChangeDisplayName, DISPLAY_NAME_CHANGE_INTERVAL_MS, getDisplayNameChangeAvailableAt } from "./displayNameUtils";

describe("display name change interval", () => {
  it("cho phép đặt tên lần đầu và chặn đổi lại trong 30 ngày", () => {
    const now = new Date("2026-08-26T00:00:00.000Z");
    expect(canChangeDisplayName(null, now)).toBe(true);
    expect(canChangeDisplayName(new Date(now.getTime() - DISPLAY_NAME_CHANGE_INTERVAL_MS + 1), now)).toBe(false);
    expect(canChangeDisplayName(new Date(now.getTime() - DISPLAY_NAME_CHANGE_INTERVAL_MS), now)).toBe(true);
  });

  it("trả về đúng thời điểm được đổi tên tiếp theo", () => {
    const changedAt = new Date("2026-08-01T12:00:00.000Z");
    expect(getDisplayNameChangeAvailableAt(changedAt)?.toISOString()).toBe("2026-08-31T12:00:00.000Z");
  });
});
