// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const footerStyleConfig = { footer: { columns: 2, linkGroups: [{ id: "info", title: "Thông tin", links: [{ label: "Điều khoản", url: "/terms", enabled: true }] }, { id: "support", title: "Hỗ trợ", links: [{ label: "Liên hệ", url: "/account", enabled: true }, { label: "Ẩn", url: "/hidden", enabled: false }] }] } };
vi.mock("@/lib/trpc", () => ({ trpc: { branding: { get: { useQuery: () => ({ data: { styleConfig: footerStyleConfig } }) } } } }));
vi.mock("@/components/BrandLogo", () => ({ default: () => <span>Dshare</span> }));

import PublicSiteFooter from "../client/src/components/PublicSiteFooter";

describe("PublicSiteFooter", () => {
  afterEach(() => cleanup());

  it("hiển thị các nhóm liên kết theo cột và ẩn liên kết đã tắt", () => {
    render(<PublicSiteFooter />);
    expect(screen.getByRole("heading", { name: "Thông tin" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Hỗ trợ" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Điều khoản" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "Liên hệ" }).getAttribute("href")).toBe("/account");
    expect(screen.queryByRole("link", { name: "Ẩn" })).toBeNull();
  });
});
