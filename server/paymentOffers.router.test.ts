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

function mockCatalog(itemCodes: string[]) {
  let selectCount = 0;
  const managedPlans = [
    { id: 10, code: "pro-thang", name: "PRO linh hoạt", tier: "pro", description: "Gói PRO động", benefits: ["Tặng 150 Point"], monthlyPrice: 50_000, promoPrice: 25_000, payosEnabled: true, payosRewardPoints: 150, membershipMonths: 1, displayOrder: 1, isActive: true },
    { id: 11, code: "premium-thang", name: "PREMIUM linh hoạt", tier: "premium", description: "Gói Premium động", benefits: ["Tặng 1.000 Point"], monthlyPrice: 100_000, promoPrice: 50_000, payosEnabled: true, payosRewardPoints: 1_000, membershipMonths: 1, displayOrder: 2, isActive: true },
  ];
  const from = vi.fn(() => ({ where: vi.fn(() => Promise.resolve(++selectCount === 1 ? itemCodes.map(itemCode => ({ itemCode })) : managedPlans)) }));
  mocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })) });
}

describe("payment.offers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("trả gói PayOS theo tên, giá, quyền lợi và Point do quản trị cấu hình", async () => {
    mockCatalog([]);
    const offers = await caller().payment.offers();
    expect(offers.find(offer => offer.code === "membership-10")).toMatchObject({ label: "PRO linh hoạt", amount: 25_000, regularAmount: 50_000, pointAmount: 150, targetTier: "pro", discounted: true, discountLabel: "Giá ưu đãi", benefits: ["Tặng 150 Point"] });
    expect(offers.find(offer => offer.code === "membership-11")).toMatchObject({ label: "PREMIUM linh hoạt", amount: 50_000, regularAmount: 100_000, pointAmount: 1_000, targetTier: "premium", discounted: true, discountLabel: "Giá ưu đãi", benefits: ["Tặng 1.000 Point"] });
  });

  it("giữ catalog theo cấu hình gói ngay cả khi người dùng đã có giao dịch trước đó", async () => {
    mockCatalog(["membership-10"]);
    const offers = await caller().payment.offers();
    expect(offers.find(offer => offer.code === "membership-10")).toMatchObject({ amount: 25_000, discounted: true, discountLabel: "Giá ưu đãi" });
    expect(offers.find(offer => offer.code === "membership-11")).toMatchObject({ amount: 50_000, discounted: true });
  });
});
