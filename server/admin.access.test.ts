import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function callerFor(role: "user" | "admin") {
  const ctx: TrpcContext = {
    user: {
      id: 7,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("admin access", () => {
  it("rejects an ordinary user before running an admin procedure", async () => {
    await expect(callerFor("user").admin.overview()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
