import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getQuizDetail: vi.fn() }));

vi.mock("./db", async importOriginal => ({ ...(await importOriginal<typeof import("./db")>()), getQuizDetail: mocks.getQuizDetail }));

import { appRouter } from "./routers";

function caller(userId: number) {
  const ctx: TrpcContext = { user: { id: userId, openId: `user-${userId}`, name: "Test User", email: "test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
  return appRouter.createCaller(ctx);
}

describe("quiz private visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQuizDetail.mockResolvedValue({ quiz: { id: 52, title: "Quiz riêng tư", isPublished: true, creatorUserId: 7, visibility: "private" }, category: {}, subject: {}, lesson: {}, questions: [] });
  });

  it("từ chối người không phải chủ sở hữu khi mở liên kết Quiz Private", async () => {
    await expect(caller(8).catalog.detail({ quizId: 52 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cho phép chủ sở hữu xem Quiz Private", async () => {
    await expect(caller(7).catalog.detail({ quizId: 52 })).resolves.toMatchObject({ quiz: { id: 52, visibility: "private" } });
  });
});
