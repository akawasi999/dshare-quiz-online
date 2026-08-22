// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { showcaseQuizzes } from "../client/src/data/demo";

vi.mock("@/components/SiteHeader", () => ({ default: () => <header>Header</header> }));
vi.mock("@/components/QuizCard", () => ({ default: ({ quiz }: { quiz: { title: string } }) => <article data-testid="quiz-card">{quiz.title}</article> }));
vi.mock("@/lib/trpc", () => ({ trpc: { catalog: { list: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) } } } }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useLocation: () => ["/", vi.fn()] }));

import Home from "../client/src/pages/Home";

describe("Home quiz discovery", () => {
  afterEach(cleanup);

  it("hiển thị khu vực Quiz AI với ba hình minh họa đã cung cấp", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Tạo câu hỏi từ nội dung bạn đã có." })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Bắt đầu tạo Quiz/i }).getAttribute("href")).toBe("/tao-quiz");
    expect(screen.getByRole("img", { name: "Minh họa AI biến tài liệu thành Quiz" }).getAttribute("src")).toBe("/manus-storage/v3_2_1_image_en_2x_5b02546b.webp");
    expect(screen.getByRole("img", { name: "Minh họa AI tạo đáp án và lựa chọn" }).getAttribute("src")).toBe("/manus-storage/v3_2_2_image_en_2x_e8570fbb.webp");
    expect(screen.getByRole("img", { name: "Minh họa AI gợi ý nhiều phiên bản câu hỏi" }).getAttribute("src")).toBe("/manus-storage/v3_2_3_image_en_2x_33af5b55.webp");
  });

  it("supports search and reward sorting for visible Quiz Cards", async () => {
    const user = userEvent.setup();
    render(<Home />);

    expect(screen.getAllByTestId("quiz-card")).toHaveLength(showcaseQuizzes.length);
    await user.selectOptions(screen.getByRole("combobox", { name: "Sắp xếp bộ đề" }), "reward");
    const expectedTopTitle = [...showcaseQuizzes].sort((left, right) => Number(right.reward ?? 0) - Number(left.reward ?? 0))[0]?.title;
    expect(screen.getAllByTestId("quiz-card")[0]?.textContent).toBe(expectedTopTitle);

    const search = screen.getByRole("textbox", { name: "Tìm bộ đề" });
    await user.type(search, showcaseQuizzes[0]?.title ?? "");
    expect(screen.getAllByTestId("quiz-card")).toHaveLength(1);
  });
});
