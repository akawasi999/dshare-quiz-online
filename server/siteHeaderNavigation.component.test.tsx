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

  it("hiển thị navigation nhóm, CTA và không khôi phục lối vào Xếp hạng/Giới thiệu", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    expect(screen.getByRole("button", { name: "Giới thiệu về chúng tôi" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Khám phá" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Bảng giá" }).getAttribute("href")).toBe("/bang-gia");
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Xếp hạng" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Giới thiệu" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Khám phá" }));
    expect(screen.getByRole("menuitem", { name: /Thư viện Quiz/ }).getAttribute("href")).toBe("/kham-pha");
    expect(screen.getByRole("menuitem", { name: /Luyện tập/ }).getAttribute("href")).toBe("/luyen-tap");

    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(screen.queryByRole("link", { name: "Xếp hạng" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Giới thiệu" })).toBeNull();
  });
});
