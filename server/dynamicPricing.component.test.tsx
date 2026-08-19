// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  plans: { data: [] as Array<{ id: number; code: string; name: string; tier: "basic" | "pro" | "premium"; description: string | null; benefits: string[] | null; monthlyPrice: number; promoPrice: number | null; payosEnabled: boolean; displayOrder: number; isActive: boolean }>, isLoading: false, error: null as Error | null },
}));

vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({ trpc: { catalog: { membershipPlans: { useQuery: () => mocks.plans } } } }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import Pricing from "../client/src/pages/Pricing";

describe("Pricing dynamic plans", () => {
  beforeEach(() => {
    mocks.plans.data = [];
    mocks.plans.isLoading = false;
    mocks.plans.error = null;
  });
  afterEach(cleanup);

  it("hiển thị tên, mô tả, quyền lợi, giá khuyến mãi và CTA PayOS do quản trị cấu hình", () => {
    mocks.plans.data = [{ id: 7, code: "practice-plus", name: "Luyện thi Plus", tier: "pro", description: "Gói được quản trị cập nhật", benefits: ["Tặng 300 Point", "Hỗ trợ ưu tiên"], monthlyPrice: 89000, promoPrice: 49000, payosEnabled: true, displayOrder: 1, isActive: true }];
    render(<Pricing />);
    expect(screen.getByText("Luyện thi Plus")).toBeTruthy();
    expect(screen.getByText("Gói được quản trị cập nhật")).toBeTruthy();
    expect(screen.getByText("49.000đ")).toBeTruthy();
    expect(screen.getByText("Giá gốc 89.000đ")).toBeTruthy();
    expect(screen.getByText("Tặng 300 Point")).toBeTruthy();
    expect(screen.getByText("Hỗ trợ ưu tiên")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Nâng cấp qua PayOS" }).getAttribute("href")).toBe("/nap-point?planTier=pro");
  });

  it("hiển thị trạng thái trống khi quản trị chưa kích hoạt gói nào", () => {
    render(<Pricing />);
    expect(screen.getByRole("status").textContent).toContain("chưa có gói đăng ký");
  });
});
