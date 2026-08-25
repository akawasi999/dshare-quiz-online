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
  it("chỉ hiển thị đường dẫn Chủ đề, tag hạng và nút Làm bài cho card catalog", () => {
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
      tier: "Basic",
      accent: "#007453",
      coverImage: "/manus-storage/cover.png",
    }} />);

    expect(screen.getByText("Tiểu học › Lớp 6 › Tin học")).toBeTruthy();
    expect(screen.getByText("Basic")).toBeTruthy();
    expect(screen.queryByText("Ôn tập")).toBeNull();
    expect(screen.queryByText("GS6 Spark")).toBeNull();
    expect(screen.queryByText("TRAINING 01")).toBeNull();
    expect(screen.getByText("Trung bình").className).toContain("bg-warning/10");
    expect(screen.getByText("Trung bình").className).toContain("text-warning");
    expect(screen.getByRole("link", { name: /làm bài/i }).getAttribute("href")).toBe("/quiz/77");
  });
});
