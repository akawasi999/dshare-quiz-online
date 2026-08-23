// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  catalog: { data: [] as unknown[], isLoading: false, isError: false, error: null as Error | null, refetch: vi.fn() },
  leaderboard: { data: [] as unknown[], isLoading: false, isError: false, error: null as Error | null, refetch: vi.fn() },
  xp: { data: [] as unknown[], isLoading: false, isError: false, error: null as Error | null, refetch: vi.fn() },
}));

vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    catalog: { list: { useQuery: () => mocks.catalog } },
    leaderboard: { list: { useQuery: () => mocks.leaderboard }, xp: { useQuery: () => mocks.xp } },
  },
}));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import Leaderboard from "../client/src/pages/Leaderboard";

describe("Leaderboard component", () => {
  beforeEach(() => {
    mocks.catalog.data = [];
    mocks.catalog.isLoading = false;
    mocks.catalog.isError = false;
    mocks.catalog.refetch.mockReset();
    mocks.leaderboard.data = [];
    mocks.leaderboard.isLoading = false;
    mocks.leaderboard.isError = false;
    mocks.leaderboard.refetch.mockReset();
    mocks.xp.data = [];
    mocks.xp.isLoading = false;
    mocks.xp.isError = false;
    mocks.xp.refetch.mockReset();
  });

  afterEach(cleanup);

  it("phản ánh phạm vi chọn bằng aria-pressed và yêu cầu chọn bộ đề", async () => {
    const user = userEvent.setup();
    render(<Leaderboard />);
    expect(screen.getByRole("button", { name: "Toàn hệ thống" }).getAttribute("aria-pressed")).toBe("true");
    await user.click(screen.getByRole("button", { name: "Theo bộ đề" }));
    expect(screen.getByRole("button", { name: "Theo bộ đề" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: "Chọn bộ đề để xem thành tích" })).toBeTruthy();
  });

  it("cung cấp thao tác thử lại khi tải bảng XP gặp lỗi", async () => {
    const user = userEvent.setup();
    mocks.xp.isError = true;
    render(<Leaderboard />);
    expect(screen.getByRole("alert")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.xp.refetch).toHaveBeenCalledTimes(1);
  });

  it("đặt leaderboard XP làm mặc định và đổi được kỳ xếp hạng", async () => {
    const user = userEvent.setup();
    mocks.xp.data = [{ userId: 1, name: "Học viên XP", xp: 420, levelName: "Quiz Explorer", currentStreak: 3 }];
    render(<Leaderboard />);
    expect(screen.getByText("420")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Tuần này" }));
    expect(screen.getByRole("button", { name: "Tuần này" }).getAttribute("aria-pressed")).toBe("true");
  });
});
