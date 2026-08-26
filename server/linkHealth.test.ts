import { describe, expect, it } from "vitest";
import { normalizeInternalPath, summarizeLinkHealth } from "./linkHealth";

describe("link health", () => {
  it("chỉ nhận đường dẫn nội bộ và loại bỏ query nhạy cảm", () => {
    expect(normalizeInternalPath("/quiz/12?token=secret")).toBe("/quiz/12");
    expect(normalizeInternalPath("https://outside.example/404")).toBeNull();
    expect(normalizeInternalPath("//outside.example/404")).toBeNull();
  });

  it("tổng hợp đúng số lỗi, đường dẫn duy nhất và đường dẫn xuất hiện nhiều", () => {
    const now = new Date("2026-08-26T00:00:00.000Z");
    const snapshot = summarizeLinkHealth([
      { id: 3, path: "/lost", referrerPath: null, occurredAt: new Date("2026-08-25T22:00:00.000Z") },
      { id: 2, path: "/lost", referrerPath: "/quiz", occurredAt: new Date("2026-08-25T20:00:00.000Z") },
      { id: 1, path: "/old", referrerPath: null, occurredAt: new Date("2026-08-10T00:00:00.000Z") },
    ], now);
    expect(snapshot).toMatchObject({ eventsLast24h: 2, eventsLast7d: 2, uniquePaths: 2 });
    expect(snapshot.topPaths[0]).toMatchObject({ path: "/lost", count: 2 });
  });
});
