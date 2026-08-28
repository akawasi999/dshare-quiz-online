// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/AuthActionLink", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import QuizCard from "../client/src/components/QuizCard";

describe("QuizCard", () => {
  it("hiển thị ảnh trái, tag gói, tác giả và metadata làm bài cho card catalog", () => {
    render(<QuizCard quiz={{
      id: 77,
      title: "Kiểm tra chương 1",
      summary: "Củng cố kiến thức nền tảng.",
      category: "Tiểu học",
      subject: "GS6 Spark",
      lesson: "TRAINING 01",
      topicPath: "Tiểu học › Lớp 6 › Tin học",
      difficulty: "Trung bình",
      mode: "Ôn tập",
      questionCount: 11,
      duration: "15 phút",
      points: 0,
      reward: 0,
      authorName: "Nguyễn An",
      tier: "Basic",
      accent: "#007453",
      coverImage: "/manus-storage/cover.png",
      visibility: "public",
    }} />);

    expect(screen.getByText("Tiểu học › Lớp 6 › Tin học")).toBeTruthy();
    expect(screen.getByText("Nguyễn An")).toBeTruthy();
    expect(screen.getByText("Basic")).toBeTruthy();
    expect(screen.queryByText("Ôn tập")).toBeNull();
    expect(screen.queryByText("TRAINING 01")).toBeNull();
    expect(screen.getByText("Trung bình").className).toContain("bg-[#FFEDD5]");
    expect(screen.getByText("Trung bình").className).toContain("text-[#C2410C]");
    const quizLink = screen.getByRole("link", { name: /làm bài/i });
    expect(quizLink.getAttribute("href")).toBe("/quiz/77");
    expect(quizLink.querySelector("article")).toBeTruthy();
    expect(screen.getByText("+0 XP")).toBeTruthy();
    expect(screen.getByLabelText("Quiz công khai").getAttribute("data-icon-tooltip")).toContain("Công khai");
  });

  it("hiển thị ổ khóa đóng ở góc ảnh bìa khi Quiz ở chế độ private", () => {
    render(<QuizCard quiz={{ id: 78, title: "Quiz riêng", summary: "", category: "", subject: "", lesson: "", difficulty: "Dễ", mode: "Ôn tập", questionCount: 2, duration: "5 phút", points: 0, reward: 0, tier: "Basic", accent: "#007453", visibility: "private" }} />);
    expect(screen.getByLabelText("Quiz riêng tư").getAttribute("data-icon-tooltip")).toContain("ẩn khỏi Khám phá");
  });
});
