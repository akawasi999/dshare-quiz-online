import { describe, expect, it } from "vitest";
import { accountStatusMessage, hasRolePermission } from "../shared/accessControl";
import type { TrpcContext } from "./_core/context";
import { permissionProcedure, router } from "./_core/trpc";
import { appRouter } from "./routers";

function context(status: "active" | "suspended" | "banned" | "deactivated" = "active", role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: { id: 44, openId: "authz-user", name: "Kiểm thử", email: "authz@example.com", loginMethod: "email", role, accountStatus: status, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("authorization policy", () => {
  it("chỉ cấp admin.access cho quản trị viên nhưng giữ quyền học tập cơ bản cho user", () => {
    expect(hasRolePermission("user", "quiz.create")).toBe(true);
    expect(hasRolePermission("user", "admin.access")).toBe(false);
    expect(hasRolePermission("admin", "admin.access")).toBe(true);
  });

  it("từ chối tài khoản bị đình chỉ trước khi chạy protected procedure", async () => {
    const caller = appRouter.createCaller(context("suspended"));
    await expect(caller.learner.summary()).rejects.toMatchObject({ code: "FORBIDDEN", message: accountStatusMessage("suspended") });
  });

  it("permission procedure từ chối guest và cho phép user active thực hiện thao tác được cấp", async () => {
    const guardedRouter = router({ createQuiz: permissionProcedure("quiz.create").query(() => ({ success: true })) });
    const guestCaller = guardedRouter.createCaller({ ...context(), user: null });
    const userCaller = guardedRouter.createCaller(context());
    await expect(guestCaller.createQuiz()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(userCaller.createQuiz()).resolves.toEqual({ success: true });
  });
});
