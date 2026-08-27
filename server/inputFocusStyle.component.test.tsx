// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "../client/src/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "../client/src/components/ui/select";
import { Textarea } from "../client/src/components/ui/textarea";

describe("Trạng thái focus của ô nhập liệu", () => {
  it("không gắn lớp viền hoặc ring màu khi focus cho Input, Textarea và Select dùng chung", () => {
    render(<><Input aria-label="Ô nhập kiểm tra" /><Textarea aria-label="Vùng nhập kiểm tra" /><Select><SelectTrigger aria-label="Chọn kiểm tra"><SelectValue placeholder="Chọn giá trị" /></SelectTrigger></Select></>);
    const input = screen.getByRole("textbox", { name: "Ô nhập kiểm tra" });
    const textarea = screen.getByRole("textbox", { name: "Vùng nhập kiểm tra" });
    const select = screen.getByRole("combobox", { name: "Chọn kiểm tra" });
    expect(input.className).toContain("focus-visible:border-transparent");
    expect(input.className).toContain("focus-visible:ring-0");
    expect(input.className).not.toContain("focus-visible:border-ring");
    expect(textarea.className).toContain("focus-visible:border-transparent");
    expect(textarea.className).toContain("focus-visible:ring-0");
    expect(textarea.className).not.toContain("focus-visible:border-ring");
    expect(select.className).toContain("focus-visible:border-transparent");
    expect(select.className).toContain("focus-visible:ring-0");
    expect(select.className).not.toContain("focus-visible:border-ring");
  });
});
