import { describe, expect, it } from "vitest";
import { buildPayosFulfillmentEffects } from "./payosFulfillmentUtils";

describe("PayOS fulfillment effects", () => {
  it("ghi đúng Point và một dòng sổ cái cho gói Point đã thanh toán", () => {
    const effects = buildPayosFulfillmentEffects({ record: { id: 1, itemType: "points", itemCode: "point_150", pointAmount: 150, targetTier: null, membershipMonths: null }, profile: { pointBalance: 20, tier: "basic", tierExpiresAt: null } });
    expect(effects.profile).toMatchObject({ pointBalance: 170, tier: "basic" });
    expect(effects.wallet).toEqual({ type: "top_up", amount: 150, balanceAfter: 170, description: "Nạp Point qua PayOS: point_150" });
  });

  it("cấp gói Premium, Point thưởng và gia hạn theo tháng chỉ từ hiệu ứng thành công", () => {
    const effects = buildPayosFulfillmentEffects({ record: { id: 2, itemType: "membership", itemCode: "premium_monthly", pointAmount: 1_000, targetTier: "premium", membershipMonths: 1 }, profile: { pointBalance: 35, tier: "basic", tierExpiresAt: null }, now: new Date("2026-08-18T00:00:00.000Z") });
    expect(effects.profile).toMatchObject({ pointBalance: 1_035, tier: "premium", tierExpiresAt: new Date("2026-09-18T00:00:00.000Z") });
    expect(effects.wallet).toMatchObject({ type: "plan_upgrade", amount: 1_000, balanceAfter: 1_035 });
  });
});
