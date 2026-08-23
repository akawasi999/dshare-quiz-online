// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BrandLogo, { BRAND_LOGO_URL } from "../client/src/components/BrandLogo";

describe("BrandLogo", () => {
  it("hiển thị logo Dshare mới từ kho tài sản dùng chung", () => {
    render(<BrandLogo />);
    const logo = screen.getByRole("img", { name: "Dshare Quiz Online" });
    expect(logo.getAttribute("src")).toBe(BRAND_LOGO_URL);
    expect(BRAND_LOGO_URL).toContain("dshare-quiz-online-logo");
  });

  it("áp dụng biến thể đơn sắc có độ tương phản cao cho chế độ tối", () => {
    const { container } = render(<BrandLogo monochrome />);
    const logo = container.querySelector("img");
    expect(logo).not.toBeNull();
    expect(logo?.className).toContain("brightness-0");
    expect(logo?.className).toContain("invert");
  });

  it("ưu tiên logo tùy chỉnh khi Appearance cung cấp đường dẫn ảnh", () => {
    const { container } = render(<BrandLogo src="/manus-storage/custom-dshare-logo.png" monochrome />);
    const logo = container.querySelector("img")!;
    expect(logo.getAttribute("src")).toBe("/manus-storage/custom-dshare-logo.png");
    expect(logo.className).not.toContain("brightness-0");
  });
});
