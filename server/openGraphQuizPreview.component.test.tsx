// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OpenGraphQuizPreview from "../client/src/components/OpenGraphQuizPreview";

describe("OpenGraphQuizPreview", () => {
  it("hiển thị tiêu đề, ảnh và URL public của Quiz", () => {
    render(<OpenGraphQuizPreview quiz={{ id: 88, title: "Excel cơ bản", summary: "Ôn tập hàm Excel.", coverImageUrl: "/manus-storage/excel-cover.png" }} />);
    expect(screen.getByText("Xem trước Open Graph")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Ảnh chia sẻ Excel cơ bản" }).getAttribute("src")).toBe("/manus-storage/excel-cover.png");
    expect(screen.getByRole("link", { name: /Mở/i }).getAttribute("href")).toBe("https://dsharequiz-jxleeaps.manus.space/quiz/88");
    expect(screen.getByRole("link", { name: "Làm mới cache Facebook cho Quiz này" }).getAttribute("href")).toContain("developers.facebook.com/tools/debug");
    expect(screen.getByRole("link", { name: "Làm mới cache LinkedIn cho Quiz này" }).getAttribute("href")).toContain("linkedin.com/post-inspector");
  });
});
