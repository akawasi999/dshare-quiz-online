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
});
