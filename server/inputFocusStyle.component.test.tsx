// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "../client/src/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "../client/src/components/ui/select";
import { Textarea } from "../client/src/components/ui/textarea";

describe("Trạng thái focus của ô nhập liệu", () => {
  it("dùng gạch chân tím khi focus cho Input, Textarea và Select, nhưng vẫn giữ trạng thái lỗi", () => {
    render(<><Input aria-label="Ô nhập kiểm tra" /><Textarea aria-label="Vùng nhập kiểm tra" /><Select><SelectTrigger aria-label="Chọn kiểm tra"><SelectValue placeholder="Chọn giá trị" /></SelectTrigger></Select></>);
    const input = screen.getByRole("textbox", { name: "Ô nhập kiểm tra" });
    const textarea = screen.getByRole("textbox", { name: "Vùng nhập kiểm tra" });
    const select = screen.getByRole("combobox", { name: "Chọn kiểm tra" });
    expect(input.className).toContain("focus-visible:ring-0");
    expect(input.className).not.toContain("focus-visible:border-ring");
    expect(textarea.className).toContain("focus-visible:ring-0");
    expect(textarea.className).not.toContain("focus-visible:border-ring");
    expect(select.className).toContain("focus-visible:ring-0");
    expect(select.className).not.toContain("focus-visible:border-ring");
    expect(input.className).toContain("aria-invalid:border-destructive");
    expect(textarea.className).toContain("aria-invalid:border-destructive");
    expect(select.className).toContain("aria-invalid:border-destructive");
    const styles = readFileSync("client/src/index.css", "utf8");
    expect(styles).toContain("--field-focus-underline: #7057e8;");
    expect(styles).toContain("--field-focus-underline: #c4b5fd;");
    expect(styles).toContain("border-bottom-color: var(--field-focus-underline) !important;");
    expect(styles).toContain("border-bottom-width: 2px !important;");
    expect(styles).toContain("box-shadow: none !important;");
    expect(styles).toContain(':not([aria-invalid="true"]):focus-visible');
  });
});
