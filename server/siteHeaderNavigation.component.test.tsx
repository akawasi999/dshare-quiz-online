// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ toggleTheme: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, logout: vi.fn() }) }));
vi.mock("@/contexts/ThemeContext", () => ({ useTheme: () => ({ theme: "light", toggleTheme: mocks.toggleTheme }) }));
vi.mock("@/components/BrandLogo", () => ({ default: () => <span>Dshare</span> }));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>, useLocation: () => ["/"] }));

import SiteHeader from "../client/src/components/SiteHeader";

describe("SiteHeader navigation", () => {
  afterEach(cleanup);

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
    expect(screen.getByRole("button", { name: "Khám phá" }).className).toContain("site-header-nav-item");
    expect(screen.getByRole("button", { name: "Bắt đầu" }).className).toContain("site-header-text");
    expect(screen.queryByRole("link", { name: "Xếp hạng" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Khám phá" }));
    expect(screen.getByRole("menuitem", { name: /Công nghệ thông tin/ }).getAttribute("href")).toContain("topic=cong-nghe-thong-tin");
    expect(screen.getByRole("menuitem", { name: /Tin học văn phòng/ })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Hỗ trợ khách hàng" }));
    expect(screen.getByRole("menuitem", { name: "Câu hỏi thường gặp" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Hướng dẫn sử dụng" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Tin cập nhật" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Thông báo" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(screen.queryByRole("link", { name: "Xếp hạng" })).toBeNull();
  });
});
