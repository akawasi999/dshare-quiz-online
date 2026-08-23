// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const footerStyleConfig = { footer: { columns: 2, linkGroups: [{ id: "info", title: "Thông tin", links: [{ label: "Điều khoản", url: "/terms", enabled: true, icon: "file" }] }, { id: "support", title: "Hỗ trợ", links: [{ label: "Liên hệ", url: "/account", enabled: true, icon: "mail" }, { label: "Ẩn", url: "/hidden", enabled: false }] }], socialLinks: [{ platform: "facebook", url: "https://facebook.com/dshare", enabled: true, zone: "bottom" }, { platform: "instagram", url: "", enabled: false, zone: "brand" }], socialStyle: { size: 44, showOnMobile: false } } };
vi.mock("@/lib/trpc", () => ({ trpc: { branding: { get: { useQuery: () => ({ data: { styleConfig: footerStyleConfig } }) } } } }));
vi.mock("@/components/BrandLogo", () => ({ default: () => <span>Dshare</span> }));

import PublicSiteFooter from "../client/src/components/PublicSiteFooter";

describe("PublicSiteFooter", () => {
  afterEach(() => cleanup());

  it("hiển thị các nhóm liên kết theo cột, icon và mạng xã hội đã bật", () => {
    const { container } = render(<PublicSiteFooter />);
    expect(screen.getByRole("heading", { name: "Thông tin" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Hỗ trợ" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Điều khoản" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "Liên hệ" }).getAttribute("href")).toBe("/account");
    expect(screen.queryByRole("link", { name: "Ẩn" })).toBeNull();
    expect(screen.getByRole("link", { name: "Facebook" }).getAttribute("href")).toBe("https://facebook.com/dshare");
    expect(screen.getByRole("link", { name: "Facebook" }).className).toContain("rounded-full");
    expect(screen.getByRole("link", { name: "Facebook" }).className).toContain("footer-social-icon");
    expect(screen.getByRole("link", { name: "Facebook" }).parentElement?.className).toContain("footer-social-hide-mobile");
    expect(screen.getByRole("link", { name: "Facebook" }).getAttribute("style")).toContain("width: 44px");
    expect(screen.queryByRole("link", { name: "Instagram" })).toBeNull();
    expect(screen.getByRole("link", { name: "Điều khoản sử dụng" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "Chính sách bảo mật" }).getAttribute("href")).toBe("/privacy");
    expect(screen.getByRole("link", { name: "Liên hệ & Hỗ trợ" }).getAttribute("href")).toBe("/support");
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });
});
