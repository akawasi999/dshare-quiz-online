// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/SiteHeader", () => ({ default: () => <header>Header</header> }));
vi.mock("@/components/QuizCard", () => ({ default: ({ quiz }: { quiz: { title: string } }) => <article data-testid="quiz-card">{quiz.title}</article> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    catalog: {
      list: {
        useQuery: () => ({
          data: [
            { quizId: 901, title: "Catalog Python", rootTopicTitle: "Công nghệ", topicTitle: "Lập trình", categoryTitle: "Công nghệ", subjectTitle: "Python", lessonTitle: "Bài 1", topicPath: "Công nghệ › Lập trình", summary: "Quiz live", mode: "testing", difficulty: "easy", durationSeconds: 1500, questionCount: 20, entryPointCost: 0, completionReward: 30, attemptCount: 12, recentAttemptCount: 3, createdAt: new Date("2026-08-01"), coverImageUrl: null, creatorName: "Tác giả live", accessTier: "basic" },
            { quizId: 902, title: "Catalog Data", rootTopicTitle: "Công nghệ", topicTitle: "Phân tích", categoryTitle: "Công nghệ", subjectTitle: "Dữ liệu", lessonTitle: "Bài 2", topicPath: "Công nghệ › Phân tích", summary: "Quiz live", mode: "testing", difficulty: "medium", durationSeconds: 2100, questionCount: 30, entryPointCost: 10, completionReward: 80, attemptCount: 8, recentAttemptCount: 2, createdAt: new Date("2026-08-02"), coverImageUrl: null, creatorName: "Tác giả live", accessTier: "pro" },
            { quizId: 903, title: "Catalog Writing", rootTopicTitle: "Ngoại ngữ", topicTitle: "IELTS", categoryTitle: "Ngoại ngữ", subjectTitle: "Writing", lessonTitle: "Bài 5", topicPath: "Ngoại ngữ › IELTS", summary: "Quiz live", mode: "testing", difficulty: "medium", durationSeconds: 1800, questionCount: 24, entryPointCost: 0, completionReward: 40, attemptCount: 5, recentAttemptCount: 1, createdAt: new Date("2026-08-03"), coverImageUrl: null, creatorName: "Tác giả live", accessTier: "basic" },
            { quizId: 904, title: "Catalog Critical Thinking", rootTopicTitle: "Kỹ năng", topicTitle: "Tư duy", categoryTitle: "Kỹ năng", subjectTitle: "Phản biện", lessonTitle: "Bài 3", topicPath: "Kỹ năng › Tư duy", summary: "Quiz live", mode: "testing", difficulty: "hard", durationSeconds: 2400, questionCount: 25, entryPointCost: 15, completionReward: 120, attemptCount: 15, recentAttemptCount: 4, createdAt: new Date("2026-08-04"), coverImageUrl: null, creatorName: "Tác giả live", accessTier: "premium" },
          ],
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        }),
      },
    },
  },
}));
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

    expect(screen.getAllByTestId("quiz-card")).toHaveLength(4);
    await user.selectOptions(screen.getByRole("combobox", { name: "Sắp xếp bộ đề" }), "reward");
    expect(screen.getAllByTestId("quiz-card")[0]?.textContent).toBe("Catalog Critical Thinking");

    const search = screen.getByRole("textbox", { name: "Tìm bộ đề" });
    await user.type(search, "Catalog Python");
    expect(screen.getAllByTestId("quiz-card")).toHaveLength(1);
  });
});
