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

  it("chỉ giữ Quiz và Gói phí ở menu đầu trang; các lối vào Xếp hạng/Giới thiệu nằm trong hồ sơ", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Quiz" }).getAttribute("href")).toBe("/kham-pha");
    expect(screen.getByRole("link", { name: "Gói phí" }).getAttribute("href")).toBe("/bang-gia");
    expect(screen.queryByRole("link", { name: "Xếp hạng" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Giới thiệu" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(screen.queryByRole("link", { name: "Xếp hạng" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Giới thiệu" })).toBeNull();
  });
});
