// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/SiteHeader", () => ({ default: () => <header>Header</header> }));
vi.mock("@/lib/trpc", () => ({ trpc: { site: { legalSupport: { useQuery: () => ({ data: { termsContent: "Điều khoản do CPanel quản lý.\n\nNội dung được cập nhật.", termsUpdatedAt: new Date("2026-08-23"), privacyContent: "Bảo mật do CPanel quản lý.\n\nDữ liệu được bảo vệ.", privacyUpdatedAt: new Date("2026-08-22") } }) } } } }));

import Legal from "../client/src/pages/Legal";

describe("Legal pages", () => {
  afterEach(cleanup);
  it("hiển thị Điều khoản từ dữ liệu CPanel cùng ngày cập nhật", () => {
    render(<Legal document="terms" />);
    expect(screen.getByRole("heading", { name: "Điều khoản sử dụng" })).toBeTruthy();
    expect(screen.getByText("Điều khoản do CPanel quản lý.")).toBeTruthy();
    expect(screen.getByText(/23\/08\/2026/)).toBeTruthy();
  });
  it("hiển thị Chính sách bảo mật từ dữ liệu CPanel", () => {
    render(<Legal document="privacy" />);
    expect(screen.getByRole("heading", { name: "Chính sách bảo mật" })).toBeTruthy();
    expect(screen.getByText("Bảo mật do CPanel quản lý.")).toBeTruthy();
  });
});
