import { describe, expect, it } from "vitest";
import { getEffectiveTier, getMembershipFulfillment } from "./membershipUtils";

describe("membership expiry", () => {
  it("hạ quyền truy cập về Basic khi gói đã hết hạn, nhưng giữ gói legacy không có hạn dùng", () => {
    const now = new Date("2026-08-18T00:00:00.000Z");
    expect(getEffectiveTier({ tier: "pro", tierExpiresAt: new Date("2026-08-17T23:59:59.000Z") }, now)).toBe("basic");
    expect(getEffectiveTier({ tier: "premium", tierExpiresAt: null }, now)).toBe("premium");
  });

  it("cấp và gia hạn một tháng từ ngày hết hạn còn hiệu lực", () => {
    const now = new Date("2026-08-18T00:00:00.000Z");
    expect(getMembershipFulfillment({ currentTier: "basic", tierExpiresAt: null, targetTier: "pro", membershipMonths: 1, now })).toMatchObject({ tier: "pro", tierExpiresAt: new Date("2026-09-18T00:00:00.000Z") });
    expect(getMembershipFulfillment({ currentTier: "pro", tierExpiresAt: new Date("2026-09-18T00:00:00.000Z"), targetTier: "pro", membershipMonths: 1, now })).toMatchObject({ tier: "pro", tierExpiresAt: new Date("2026-10-18T00:00:00.000Z") });
  });
});
