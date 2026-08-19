// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  summary: { data: { profile: { tier: "basic", pointBalance: 0, avatarUrl: "", bio: "", learningGoal: "", notificationPreferences: { studyReminders: true, resultUpdates: true, platformUpdates: true } }, stats: { completed: 0, averageScore: 0, passedCount: 0 }, currentPlan: null as null | { name: string; tier: string; monthlyPrice: number; promoPrice: number | null; benefits: string[] | null }, upgradePlans: [] as Array<{ name: string; tier: "pro" | "premium"; description: string | null; payosEnabled: boolean }> }, isLoading: false, error: null as Error | null, refetch: vi.fn() },
  history: { data: [], isLoading: false, error: null as Error | null },
  quota: { data: null },
  update: { isPending: false },
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Học viên" }, loading: false }) }));
vi.mock("@/components/AccountLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({ trpc: { learner: { summary: { useQuery: () => mocks.summary }, history: { useQuery: () => mocks.history }, quota: { useQuery: () => mocks.quota }, updateProfile: { useMutation: (options: { onError?: (error: Error) => void }) => ({ ...mocks.update, mutate: () => options.onError?.(new Error("Không thể kết nối")) }) } } } }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useLocation: () => ["/ho-so", vi.fn()] }));

import Profile from "../client/src/pages/Profile";

describe("Profile mutation feedback", () => {
  beforeEach(() => { mocks.toast.error.mockReset(); mocks.summary.data.currentPlan = null; mocks.summary.data.upgradePlans = []; });
  afterEach(cleanup);

  it("công bố lỗi khi không thể lưu thiết lập hồ sơ", async () => {
    const user = userEvent.setup();
    render(<Profile />);

    await user.click(screen.getByText("Thiết lập hồ sơ & thông báo"));
    await user.click(screen.getByRole("button", { name: "Lưu thiết lập" }));

    expect(mocks.toast.error).toHaveBeenCalledWith("Không thể lưu hồ sơ", { description: "Không thể kết nối" });
  });

  it("hiển thị gói hiện tại, quyền lợi và đề xuất nâng cấp từ cấu hình quản trị", () => {
    mocks.summary.data.currentPlan = { name: "Basic học chủ động", tier: "basic", monthlyPrice: 0, promoPrice: null, benefits: ["20 lượt làm/tháng"] };
    mocks.summary.data.upgradePlans = [{ name: "PRO tăng tốc", tier: "pro", description: "Thêm quyền lợi chuyên sâu", payosEnabled: true }];
    render(<Profile />);
    expect(screen.getByLabelText("Gói đăng ký hiện tại").textContent).toContain("Basic học chủ động");
    expect(screen.getByText("20 lượt làm/tháng")).toBeTruthy();
    expect(screen.getByText("Nâng cấp lên PRO tăng tốc")).toBeTruthy();
    expect(screen.getByRole("link", { name: /xem ưu đãi/i }).getAttribute("href")).toBe("/nap-point?planTier=pro");
  });
});
