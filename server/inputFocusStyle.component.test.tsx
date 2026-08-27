// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "../client/src/components/ui/input";
import { Textarea } from "../client/src/components/ui/textarea";

describe("Trạng thái focus của ô nhập liệu", () => {
  it("không gắn lớp viền hoặc ring màu khi focus cho Input và Textarea dùng chung", () => {
    render(<><Input aria-label="Ô nhập kiểm tra" /><Textarea aria-label="Vùng nhập kiểm tra" /></>);
    const input = screen.getByRole("textbox", { name: "Ô nhập kiểm tra" });
    const textarea = screen.getByRole("textbox", { name: "Vùng nhập kiểm tra" });
    expect(input.className).toContain("focus-visible:border-input");
    expect(input.className).toContain("focus-visible:ring-0");
    expect(input.className).not.toContain("focus-visible:border-ring");
    expect(textarea.className).toContain("focus-visible:border-input");
    expect(textarea.className).toContain("focus-visible:ring-0");
    expect(textarea.className).not.toContain("focus-visible:border-ring");
  });
});
