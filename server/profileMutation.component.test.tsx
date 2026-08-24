// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

const mocks = vi.hoisted(() => ({
  summary: { data: { profile: { tier: "basic", pointBalance: 0, avatarUrl: "", bio: "", learningGoal: "", notificationPreferences: { studyReminders: true, resultUpdates: true, platformUpdates: true } }, stats: { completed: 0, averageScore: 0, passedCount: 0 }, currentPlan: null as null | { name: string; tier: string; monthlyPrice: number; promoPrice: number | null; benefits: string[] | null }, upgradePlans: [] as Array<{ name: string; tier: "pro" | "premium"; description: string | null; payosEnabled: boolean }> }, isLoading: false, error: null as Error | null, refetch: vi.fn() },
  history: { data: [], isLoading: false, error: null as Error | null },
  gamification: { data: { profile: { xpBalance: 0, currentStreak: 0 }, currentLevel: { name: "Beginner", minXp: 0, displayOrder: 1 }, nextLevel: { name: "Quiz Explorer", minXp: 250, displayOrder: 2 }, xpToNextLevel: 250, missions: [] as unknown[], achievements: [] as unknown[], badges: [] as unknown[], xpHistory: [] as unknown[] }, isLoading: false, error: null as Error | null, refetch: vi.fn() },
  leaderboard: { data: [], isLoading: false, error: null as Error | null, refetch: vi.fn() },
  referral: { data: { referralCode: "DS000001", invitations: [], totalRewarded: 0 }, isLoading: false, error: null as Error | null, refetch: vi.fn() },
  quota: { data: null },
  update: { isPending: false },
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Học viên" }, loading: false }) }));
vi.mock("@/components/AccountLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({ trpc: { learner: { summary: { useQuery: () => mocks.summary }, history: { useQuery: () => mocks.history }, gamification: { useQuery: () => mocks.gamification }, referral: { useQuery: () => mocks.referral }, quota: { useQuery: () => mocks.quota }, updateProfile: { useMutation: (options: { onError?: (error: Error) => void }) => ({ ...mocks.update, mutate: () => options.onError?.(new Error("Không thể kết nối")) }) }, uploadAvatar: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } }, leaderboard: { xp: { useQuery: () => mocks.leaderboard } } } }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useLocation: () => ["/ho-so", vi.fn()] }));

import Profile from "../client/src/pages/Profile";
import PersonalInfo from "../client/src/pages/PersonalInfo";

describe("Profile mutation feedback", () => {
  beforeEach(() => { mocks.toast.error.mockReset(); mocks.summary.data.currentPlan = null; mocks.summary.data.upgradePlans = []; mocks.summary.data.profile.avatarUrl = ""; mocks.gamification.data.achievements = []; });
  afterEach(cleanup);

  it("công bố lỗi khi không thể lưu thiết lập hồ sơ", async () => {
    const user = userEvent.setup();
    render(<PersonalInfo />);
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(mocks.toast.error).toHaveBeenCalledWith("Không thể lưu hồ sơ", { description: "Không thể kết nối" });
    expect(screen.getByLabelText("Chọn & cắt ảnh")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Xóa ảnh" })).toBeNull();
  });

  it("hiển thị thao tác xóa để đưa avatar hiện có về mặc định", () => {
    mocks.summary.data.profile.avatarUrl = "/manus-storage/learner-avatars/1/avatar.png";
    render(<PersonalInfo />);
    expect(screen.getByRole("button", { name: "Xóa ảnh" })).toBeTruthy();
    expect(screen.getByLabelText("Chọn & cắt ảnh")).toBeTruthy();
  });

  it("không hiển thị thẻ gói và quota cố định ở hai góc giao diện", () => {
    mocks.summary.data.currentPlan = { name: "Basic học chủ động", tier: "basic", monthlyPrice: 0, promoPrice: null, benefits: ["20 lượt làm/tháng"] };
    mocks.summary.data.upgradePlans = [{ name: "PRO tăng tốc", tier: "pro", description: "Thêm quyền lợi chuyên sâu", payosEnabled: true }];
    render(<Profile />);
    expect(screen.queryByLabelText("Gói đăng ký hiện tại")).toBeNull();
    expect(screen.queryByText("Quota tháng · BASIC")).toBeNull();
  });

  it("hiển thị các khối Dashboard học tập theo cấu trúc mới", () => {
    render(<Profile />);
    expect(screen.getByText("Tổng XP")).toBeTruthy();
    expect(screen.getByText("Bảng xếp hạng")).toBeTruthy();
    expect(screen.getByText("Giới thiệu bạn bè")).toBeTruthy();
    expect(screen.getByText("Nhiệm vụ hôm nay")).toBeTruthy();
    expect(screen.getByText("Thành tích")).toBeTruthy();
    expect(document.querySelector('img[src*="profile-achievement-trophy"]')).toBeTruthy();
    expect(screen.getByText("Bài Quiz đã làm")).toBeTruthy();
    expect(document.querySelector('img[src*="profile-hero-trophy"]')).toBeTruthy();
    expect(document.querySelector('img[src*="profile-point-coins"]')).toBeTruthy();
    expect(document.querySelector('img[src*="profile-achievement"]')).toBeTruthy();
  });

  it("hiển thị điều kiện mở khóa từ dữ liệu thành tích khi hover badge", async () => {
    mocks.gamification.data.achievements = [{ userAchievement: { id: 17, status: "locked", progress: 1, target: 3 }, achievement: { title: "Quiz Master", icon: "Trophy", conditionType: "quiz_completed", conditionConfig: { target: 3 } }, badge: { name: "Quiz Master", icon: "Trophy", color: "#7C5CFC" } }];
    render(<Profile />);
    expect(screen.getByText(/Điều kiện mở khóa: Hoàn thành Quiz 3 lần\. Tiến độ 1\/3\./)).toBeTruthy();
  });
});
