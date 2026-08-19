// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  report: { isPending: false, mutateAsync: vi.fn() },
  discussion: { isPending: false, mutateAsync: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/components/QuizAIStudyAssistant", () => ({ QuizAIStudyAssistant: () => null }));
vi.mock("@/lib/trpc", () => ({ trpc: { reports: { submit: { useMutation: () => mocks.report } }, discussion: { create: { useMutation: () => mocks.discussion } } } }));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useRoute: () => [true, { id: "7" }] }));

import QuizResult from "../client/src/pages/QuizResult";

const storedResult = JSON.stringify({
  scorePercent: 80,
  correctCount: 1,
  availablePoints: 1,
  earnedPoints: 1,
  passed: true,
  quiz: { title: "Quiz kiểm thử", completionReward: 10, passingScore: 70 },
  review: [{ questionId: 9, prompt: "Câu hỏi kiểm thử", explanation: "Lời giải", options: [{ id: 1, body: "Đáp án A" }], selectedOptionIds: [1], correctOptionIds: [1], isCorrect: true }],
});

describe("QuizResult mutation feedback", () => {
  beforeEach(() => {
    sessionStorage.setItem("dshare-quiz-result", storedResult);
    mocks.report.mutateAsync.mockReset();
    mocks.discussion.mutateAsync.mockReset();
    mocks.toast.error.mockReset();
    mocks.toast.success.mockReset();
  });

  afterEach(cleanup);

  it("công bố lỗi khi không thể đăng thảo luận", async () => {
    const user = userEvent.setup();
    mocks.discussion.mutateAsync.mockRejectedValue(new Error("Không có quyền"));
    render(<QuizResult />);

    await user.type(screen.getByPlaceholderText("Chia sẻ cách bạn suy luận..."), "Một nhận xét hợp lệ");
    await user.click(screen.getByRole("button", { name: "Đăng thảo luận" }));

    expect(mocks.discussion.mutateAsync).toHaveBeenCalledWith({ quizId: 7, body: "Một nhận xét hợp lệ" });
    expect(mocks.toast.error).toHaveBeenCalledWith("Chưa thể đăng thảo luận", expect.any(Object));
  });

  it("công bố lỗi khi không thể gửi báo lỗi câu hỏi", async () => {
    const user = userEvent.setup();
    mocks.report.mutateAsync.mockRejectedValue(new Error("Không có quyền"));
    vi.spyOn(window, "prompt").mockReturnValue("Mô tả lỗi đủ dài");
    render(<QuizResult />);

    await user.click(screen.getByRole("button", { name: /Câu hỏi kiểm thử/ }));
    await user.click(screen.getByRole("button", { name: "Báo lỗi câu hỏi" }));

    expect(mocks.report.mutateAsync).toHaveBeenCalledWith({ questionId: 9, details: "Mô tả lỗi đủ dài" });
    expect(mocks.toast.error).toHaveBeenCalledWith("Chưa thể gửi báo lỗi", expect.any(Object));
  });
});
