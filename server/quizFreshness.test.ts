import { describe, expect, it } from "vitest";
import { QUIZ_NEW_WINDOW_MS, formatPublicationDateTime, formatRelativePublicationTime, isQuizNew } from "../shared/quizFreshness";

describe("isQuizNew", () => {
  const now = new Date("2026-08-19T00:00:00.000Z").getTime();

  it("đánh dấu bộ đề phát hành trong 14 ngày là Mới", () => {
    expect(isQuizNew(now - 10 * 24 * 60 * 60 * 1000, now)).toBe(true);
  });

  it("không đánh dấu bộ đề cũ, ngày tương lai hoặc ngày không hợp lệ", () => {
    expect(isQuizNew(now - QUIZ_NEW_WINDOW_MS - 1, now)).toBe(false);
    expect(isQuizNew(now + 1, now)).toBe(false);
    expect(isQuizNew("không-phải-ngày", now)).toBe(false);
  });

  it("định dạng thời gian công bố tương đối và loại bỏ ngày không hợp lệ", () => {
    expect(formatRelativePublicationTime(now - 2 * 86_400_000, now)).toBe("2 ngày trước");
    expect(formatRelativePublicationTime(now - 90_000, now)).toBe("1 phút trước");
    expect(formatRelativePublicationTime("không-phải-ngày", now)).toBeNull();
    expect(formatPublicationDateTime("không-phải-ngày")).toBeNull();
  });
});
