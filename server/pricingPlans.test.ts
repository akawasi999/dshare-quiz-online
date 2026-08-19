import { describe, expect, it } from "vitest";
import { pricingPlans } from "../client/src/data/demo";

describe("pricing plans display quotas", () => {
  it("giữ đúng quota hiển thị theo chỉnh sửa bảng giá mới nhất", () => {
    const getValue = (tier: "Basic" | "Pro" | "Premium", label: string) => pricingPlans.find(plan => plan.tier === tier)?.benefits.find(benefit => benefit.label === label)?.value;
    expect(getValue("Basic", "AI Credits mỗi tháng")).toBe("20");
    expect(getValue("Basic", "Lượt thi tối đa/tháng")).toBe("20");
    expect(getValue("Basic", "Số Quiz được tạo/tháng")).toBe("2");
    expect(getValue("Pro", "AI Credits mỗi tháng")).toBe("40");
    expect(getValue("Pro", "Lượt thi tối đa/tháng")).toBe("40");
    expect(getValue("Pro", "Số Quiz được tạo/tháng")).toBe("20");
    expect(getValue("Premium", "AI Credits mỗi tháng")).toBe("50");
    expect(getValue("Premium", "Lượt thi tối đa/tháng")).toBe("Vô hạn");
    expect(getValue("Premium", "Số Quiz được tạo/tháng")).toBe("50");
  });
});
