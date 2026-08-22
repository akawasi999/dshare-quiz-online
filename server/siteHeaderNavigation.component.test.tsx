// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ toggleTheme: vi.fn(), logout: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn(), user: null as null | { id: number; name: string; role: "user" | "admin" }, summary: { profile: { avatarUrl: "https://example.com/minh.png", pointBalance: 1250 } }, notifications: { items: [{ id: 77, type: "quiz_rejected", title: "Quiz cần chỉnh sửa", body: "Lý do: cần bổ sung đáp án.", href: "/quiz-cua-toi?status=rejected", isRead: false, createdAt: new Date("2026-08-22T08:00:00Z") }], unreadCount: 1 }, topics: [{ id: 10, name: "Tiểu học", slug: "tieu-hoc", parentId: null, depth: 0 }, { id: 11, name: "Lớp 1", slug: "lop-1", parentId: 10, depth: 1 }] }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: mocks.user, loading: false, logout: mocks.logout }) }));
vi.mock("@/contexts/ThemeContext", () => ({ useTheme: () => ({ theme: "light", toggleTheme: mocks.toggleTheme }) }));
vi.mock("@/components/BrandLogo", () => ({ default: () => <span>Dshare</span> }));
vi.mock("@/lib/trpc", () => ({ trpc: { catalog: { topics: { useQuery: () => ({ data: mocks.topics }) } }, learner: { summary: { useQuery: () => ({ data: mocks.summary }) }, notifications: { useQuery: () => ({ data: mocks.notifications, refetch: vi.fn() }) }, markNotificationRead: { useMutation: () => ({ mutate: mocks.markRead }) }, markAllNotificationsRead: { useMutation: () => ({ mutate: mocks.markAllRead }) } } } }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>, useLocation: () => ["/"] }));

import SiteHeader from "../client/src/components/SiteHeader";

describe("SiteHeader navigation", () => {
  afterEach(() => { cleanup(); mocks.user = null; mocks.logout.mockReset(); });

  it("hiển thị liên kết trực tiếp, dropdown chủ đề/hỗ trợ và không khôi phục lối vào Xếp hạng", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Giới thiệu về chúng tôi" }).getAttribute("href")).toBe("/#ve-dshare");
    expect(screen.getByRole("button", { name: "Khám phá" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Bảng giá" }).getAttribute("href")).toBe("/bang-gia");
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/kham-pha");
    expect(screen.getByRole("button", { name: "Hỗ trợ khách hàng" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Bảng giá" }).className).toContain("site-header-text");
    expect(screen.getByRole("link", { name: "Giới thiệu về chúng tôi" }).className).toContain("site-header-nav-item");
    const exploreTrigger = screen.getByRole("button", { name: "Khám phá" });
    expect(exploreTrigger.className).toContain("site-header-nav-item");
    expect(exploreTrigger.querySelector(".site-header-nav-label")?.className).toContain("site-header-nav-label");
    expect(exploreTrigger.querySelector(".site-header-nav-chevron")?.getAttribute("class")).toContain("site-header-nav-chevron");
    expect(screen.getByRole("button", { name: "Bắt đầu" }).className).toContain("site-header-text");
    expect(screen.queryByRole("link", { name: "Xếp hạng" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Khám phá" }));
    expect(screen.getByRole("menuitem", { name: /Tiểu học/ }).getAttribute("href")).toContain("topic=tieu-hoc");
    expect(screen.queryByRole("menuitem", { name: /Lớp 1/ })).toBeNull();
    expect(screen.queryByText("Chủ đề", { selector: "p" })).toBeNull();
    expect(screen.queryByText("Khám phá Quiz theo Chủ đề")).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /Xem tất cả chủ đề/ })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Hỗ trợ khách hàng" }));
    expect(screen.getByRole("menuitem", { name: "Câu hỏi thường gặp" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Hướng dẫn sử dụng" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Tin cập nhật" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Thông báo" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(screen.queryByRole("link", { name: "Xếp hạng" })).toBeNull();
  });

  it("giữ dropdown Khám phá trong vùng đệm hover trước khi đóng", () => {
    vi.useFakeTimers();
    render(<SiteHeader />);
    const trigger = screen.getByRole("button", { name: "Khám phá" });
    const dropdownZone = trigger.parentElement!;
    fireEvent.mouseEnter(dropdownZone);
    expect(screen.getByRole("menu").className).toContain("top-[calc(100%+0.25rem)]");
    expect(dropdownZone.className).toContain("h-10");
    expect(dropdownZone.className).toContain("after:h-2");
    fireEvent.mouseLeave(dropdownZone);
    act(() => vi.advanceTimersByTime(179));
    expect(screen.getByRole("menu")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("menu")).toBeNull();
    vi.useRealTimers();
  });

  it("hiển thị dropdown tài khoản cho người dùng và chỉ hiển thị Admin CPanel cho admin", async () => {
    const userEventApi = userEvent.setup();
    mocks.user = { id: 1, name: "Minh Nguyễn", role: "user" };
    const { rerender } = render(<SiteHeader />);
    const accountTrigger = screen.getByRole("link", { name: /Tài khoản Minh/ });
    expect(accountTrigger.getAttribute("href")).toBe("/ho-so");
    fireEvent.mouseEnter(accountTrigger.parentElement!);
    expect(screen.getByAltText("Ảnh đại diện của Minh").getAttribute("src")).toBe("https://example.com/minh.png");
    expect(screen.getByRole("menuitem", { name: "Bảng điều khiển" }).getAttribute("href")).toBe("/ho-so");
    expect(screen.getByRole("menuitem", { name: /Ví Point/ }).textContent).toContain("1.250");
    expect(screen.getByRole("menu").className).toContain("account-dropdown");
    expect(screen.getByRole("menuitem", { name: "Đăng xuất" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Admin CPanel" })).toBeNull();
    await userEventApi.click(screen.getByRole("menuitem", { name: "Đăng xuất" }));
    expect(mocks.logout).toHaveBeenCalledTimes(1);

    mocks.user = { id: 2, name: "Quản trị", role: "admin" };
    rerender(<SiteHeader />);
    fireEvent.mouseEnter(screen.getByRole("link", { name: /Tài khoản Quản/ }).parentElement!);
    expect(screen.getByRole("menuitem", { name: "Admin CPanel" }).getAttribute("href")).toBe("/quan-tri");
  });

  it("hiển thị chuông với lịch sử thông báo và đánh dấu mục đã đọc", async () => {
    const userEventApi = userEvent.setup();
    mocks.user = { id: 1, name: "Minh Nguyễn", role: "user" };
    render(<SiteHeader />);
    await userEventApi.click(screen.getAllByRole("button", { name: /Mở thông báo, 1 chưa đọc/ })[0]!);
    expect(screen.getByRole("menu", { name: "Lịch sử thông báo" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Quiz cần chỉnh sửa/ }).getAttribute("href")).toContain("status=rejected");
    await userEventApi.click(screen.getByRole("menuitem", { name: /Quiz cần chỉnh sửa/ }));
    expect(mocks.markRead).toHaveBeenCalledWith({ notificationId: 77 });
  });
});
