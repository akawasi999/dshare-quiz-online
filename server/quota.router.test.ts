import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  ensureLearnerProfile: vi.fn(),
  getMonthlyQuotaUsage: vi.fn(),
  getQuizDetail: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getDb: mocks.getDb,
  ensureLearnerProfile: mocks.ensureLearnerProfile,
  getMonthlyQuotaUsage: mocks.getMonthlyQuotaUsage,
  getQuizDetail: mocks.getQuizDetail,
}));

import { appRouter } from "./routers";

function caller(role: "user" | "admin" = "user") {
  const ctx: TrpcContext = {
    user: { id: 31, openId: "quota-user", name: "Quota User", email: "quota@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("membership quota gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDb.mockResolvedValue({});
    mocks.ensureLearnerProfile.mockResolvedValue({ id: 1, userId: 31, tier: "basic", pointBalance: 0, isBanned: false });
    mocks.getQuizDetail.mockResolvedValue({ quiz: { id: 7, isPublished: true, accessTier: "basic" }, category: { title: "Danh mục" }, subject: { title: "Môn" }, lesson: { title: "Bài" } });
  });

  it("chặn lượt thi khi Basic đã dùng hết 20 lượt trong tháng", async () => {
    mocks.getMonthlyQuotaUsage.mockResolvedValue({ attempts: 20, quizzes: 0, aiCredits: 0 });
    await expect(caller().quiz.start({ quizId: 7 })).rejects.toMatchObject({ message: expect.stringContaining("quota lượt thi (20/tháng)") });
  });

  it("chặn tạo quiz khi Basic đã dùng hết 2 quiz trong tháng", async () => {
    mocks.getMonthlyQuotaUsage.mockResolvedValue({ attempts: 0, quizzes: 2, aiCredits: 0 });
    await expect(caller("admin").admin.saveQuiz({ lessonId: 1, title: "Quiz quota", slug: "quiz-quota", mode: "training", accessTier: "basic", durationSeconds: 600, passingScore: 70, entryPointCost: 0, completionReward: 0, isPublished: false })).rejects.toMatchObject({ message: expect.stringContaining("quota quiz tạo (2/tháng)") });
  });

  it("chặn gọi AI khi Basic đã dùng hết 20 AI Credits trong tháng", async () => {
    mocks.getMonthlyQuotaUsage.mockResolvedValue({ attempts: 0, quizzes: 0, aiCredits: 20 });
    await expect(caller().ai.explain({ question: "Giải thích khái niệm về biến trong lập trình", context: "Python" })).rejects.toMatchObject({ message: expect.stringContaining("quota AI Credits (20/tháng)") });
  });
});
