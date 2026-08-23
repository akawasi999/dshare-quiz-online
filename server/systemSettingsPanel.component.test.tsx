// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mutate = vi.fn();
const siteSettingsData = { settings: { homePageUrl: "https://dsharequiz-jxleeaps.manus.space", boardTitle: "Dshare Quiz Online", metaDescription: "Nền tảng tạo Quiz, học tập và chia sẻ kiến thức trực tuyến.", defaultEmailAddress: "admin@dshare.net" }, navigation: [{ id: 1, label: "Trang chủ", url: "/", position: 1, isEnabled: true }] };
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ site: { navigation: { invalidate: vi.fn() } } }),
    admin: {
      siteSettings: { useQuery: () => ({ data: siteSettingsData, isLoading: false, error: null, refetch: vi.fn() }) },
      saveSiteSettings: { useMutation: () => ({ mutate, isPending: false }) },
      saveNavigationItem: { useMutation: () => ({ mutate, isPending: false }) },
      deleteNavigationItem: { useMutation: () => ({ mutate, isPending: false }) },
      reorderNavigation: { useMutation: () => ({ mutate, isPending: false }) },
    },
  },
}));

import SystemSettingsPanel from "../client/src/components/SystemSettingsPanel";

describe("SystemSettingsPanel", () => {
  it("hiển thị cài đặt cơ bản và quản lý Navigation", () => {
    render(<SystemSettingsPanel />);
    expect(screen.getByLabelText("Home page URL")).toBeTruthy();
    expect(screen.getByText("Board meta description")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Navigation" }));
    expect(screen.getByText("Quản lý các mục điều hướng trong menu website.")).toBeTruthy();
    expect(screen.getByText("Trang chủ")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Thêm mục mới/i })).toBeTruthy();
  });
});
