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
    expect(screen.getByTestId("hero-creation-preview")).toBeTruthy();
    expect(screen.getByText("Tải tệp hoặc chọn chủ đề")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Bắt đầu tạo Quiz/i }).getAttribute("href")).toBe("/build");
    expect(screen.getByRole("img", { name: "Minh họa AI biến tài liệu thành Quiz" }).getAttribute("src")).toBe("/manus-storage/v3_2_1_image_en_2x_5b02546b.webp");
    expect(screen.getByRole("img", { name: "Minh họa AI tạo đáp án và lựa chọn" }).getAttribute("src")).toBe("/manus-storage/v3_2_2_image_en_2x_e8570fbb.webp");
    expect(screen.getByRole("img", { name: "Minh họa AI gợi ý nhiều phiên bản câu hỏi" }).getAttribute("src")).toBe("/manus-storage/v3_2_3_image_en_2x_33af5b55.webp");
  });

  it("hiển thị phần tạo và chia sẻ Quiz với ba hình minh họa được cung cấp", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Từ ý tưởng đến trải nghiệm học tập." })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Tạo Quiz trong 2 bước/i }).getAttribute("href")).toBe("/build");
    expect(screen.getByRole("img", { name: "Minh họa hai bước tạo Quiz từ mẫu có sẵn" }).getAttribute("src")).toBe("/manus-storage/quiz_landing_1_1_image_en_2x_27b3e0b5.webp");
    expect(screen.getByRole("img", { name: "Minh họa sao chép và tùy chỉnh câu hỏi có sẵn" }).getAttribute("src")).toBe("/manus-storage/quiz_landing_1_2_image_en_2x_abdeac42.webp");
    expect(screen.getByRole("img", { name: "Minh họa tham gia Quiz bằng mã QR trên nhiều thiết bị" }).getAttribute("src")).toBe("/manus-storage/quiz_landing_1_3_image_kr_2x_31ee6c2a.webp");
    expect(document.querySelectorAll("[data-scroll-reveal='true']").length).toBe(6);
  });

  it("không còn hiển thị dải liên kết phụ ở cuối trang chủ", () => {
    render(<Home />);

    expect(screen.queryByText("Nơi việc học được thiết kế có chủ đích.")).toBeNull();
    expect(screen.queryByRole("link", { name: "Gói học" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Thư viện" })).toBeNull();
  });

  it("chỉ giữ một khu vực giới thiệu cuối trang với khoảng cuối gọn", () => {
    const { container } = render(<Home />);
    expect(screen.getAllByText("Mỗi kết quả đều cho bạn biết bước tiếp theo.")).toHaveLength(1);
    expect(container.querySelector("section.container.pb-10.pt-8")).toBeTruthy();
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
