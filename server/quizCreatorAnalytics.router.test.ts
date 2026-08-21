import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getOwnedQuizAnalytics: vi.fn() }));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), getOwnedQuizAnalytics: mocks.getOwnedQuizAnalytics }));

import { appRouter } from "./routers";

function caller(userId = 61) {
  const ctx: TrpcContext = { user: { id: userId, openId: `analytics-${userId}`, name: "Analytics Owner", email: "owner@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

describe("creator quiz analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOwnedQuizAnalytics.mockResolvedValue({ quiz: { id: 77, title: "Ôn tập Tin học" }, summary: { completedAttempts: 12, averageScore: 74, passRate: 67, latestCompletedAt: new Date("2026-08-21T00:00:00Z") }, questions: [{ questionId: 9, prompt: "Câu hỏi 1", type: "single", points: 1, answerCount: 12, correctCount: 8, correctRate: 67 }] });
  });

  it("trả về số lượt làm và tỷ lệ đúng/sai theo câu hỏi cho chủ sở hữu", async () => {
    await expect(caller().creator.quizAnalytics({ quizId: 77 })).resolves.toMatchObject({ quiz: { title: "Ôn tập Tin học" }, summary: { completedAttempts: 12, passRate: 67 }, questions: [{ questionId: 9, correctRate: 67 }] });
    expect(mocks.getOwnedQuizAnalytics).toHaveBeenCalledWith(61, 77);
  });

  it("từ chối khi Quiz không thuộc quyền quản lý của người gọi", async () => {
    mocks.getOwnedQuizAnalytics.mockResolvedValueOnce(undefined);
    await expect(caller().creator.quizAnalytics({ quizId: 77 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
