import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getDb: mocks.getDb,
}));

import { appRouter } from "./routers";

function caller() {
  const ctx: TrpcContext = {
    user: { id: 27, openId: "offer-user", name: "Offer User", email: "offers@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

function mockPaidItems(itemCodes: string[]) {
  const where = vi.fn().mockResolvedValue(itemCodes.map(itemCode => ({ itemCode })));
  const from = vi.fn(() => ({ where }));
  mocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })) });
}

describe("payment.offers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("trả Gói PRO/Pro và Gói PREMIUM/Premium với ưu đãi lần mua đầu cùng Point thưởng đúng", async () => {
    mockPaidItems([]);
    const offers = await caller().payment.offers();
    expect(offers.find(offer => offer.code === "pro_monthly")).toMatchObject({ label: "Gói PRO (Pro) · 1 tháng", amount: 25_000, regularAmount: 50_000, pointAmount: 150, targetTier: "pro", discounted: true, discountLabel: "Giảm 50% lần mua đầu" });
    expect(offers.find(offer => offer.code === "premium_monthly")).toMatchObject({ label: "Gói PREMIUM (Premium) · 1 tháng", amount: 50_000, regularAmount: 100_000, pointAmount: 1_000, targetTier: "premium", discounted: true, discountLabel: "Giảm 50% lần mua đầu" });
  });

  it("chỉ bỏ ưu đãi ở mã gói đã có giao dịch paid", async () => {
    mockPaidItems(["pro_monthly"]);
    const offers = await caller().payment.offers();
    expect(offers.find(offer => offer.code === "pro_monthly")).toMatchObject({ amount: 50_000, discounted: false, discountLabel: null });
    expect(offers.find(offer => offer.code === "premium_monthly")).toMatchObject({ amount: 50_000, discounted: true });
  });
});
