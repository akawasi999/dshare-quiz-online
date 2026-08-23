// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/SiteHeader", () => ({ default: () => <header>Header</header> }));

import Legal from "../client/src/pages/Legal";

describe("Legal pages", () => {
  afterEach(cleanup);

  it("hiển thị nội dung Điều khoản sử dụng", () => {
    render(<Legal document="terms" />);
    expect(screen.getByRole("heading", { name: "Điều khoản sử dụng" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sử dụng nền tảng" })).toBeTruthy();
  });

  it("hiển thị nội dung Chính sách bảo mật", () => {
    render(<Legal document="privacy" />);
    expect(screen.getByRole("heading", { name: "Chính sách bảo mật" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Bảo vệ dữ liệu" })).toBeTruthy();
  });
});
