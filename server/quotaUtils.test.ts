import { describe, expect, it } from "vitest";
import { getQuotaPeriod, hasReachedQuota, membershipQuotas, quotaLabel } from "./quotaUtils";

describe("membership quotas", () => {
  it("phản ánh quota đã chốt cho ba hạng thành viên", () => {
    expect(membershipQuotas.basic).toEqual({ attemptsPerMonth: 20, quizzesPerMonth: 2, aiCreditsPerMonth: 20 });
    expect(membershipQuotas.pro).toEqual({ attemptsPerMonth: 40, quizzesPerMonth: 20, aiCreditsPerMonth: 40 });
    expect(membershipQuotas.premium).toEqual({ attemptsPerMonth: null, quizzesPerMonth: 50, aiCreditsPerMonth: null });
  });

  it("xử lý quota hữu hạn, vô hạn và chu kỳ tháng theo UTC", () => {
    expect(hasReachedQuota(19, 20)).toBe(false);
    expect(hasReachedQuota(20, 20)).toBe(true);
    expect(hasReachedQuota(999, null)).toBe(false);
    expect(quotaLabel(null)).toBe("không giới hạn");
    expect(getQuotaPeriod(new Date("2026-08-18T12:00:00.000Z"))).toEqual({ start: new Date("2026-08-01T00:00:00.000Z"), end: new Date("2026-09-01T00:00:00.000Z") });
  });
});
