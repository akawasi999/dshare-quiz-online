// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reviewReject: vi.fn(),
  invalidate: vi.fn(),
  pendingQuiz: {
    id: 41,
    title: "Kiểm tra an toàn thông tin",
    topicId: 7,
    status: "pending_review",
    version: 3,
    createdAt: new Date("2026-08-22T00:00:00Z"),
    publishedAt: null,
    questionCount: 1,
    author: { id: 5, name: "Giáo viên A", email: "teacher@example.com" },
    topic: { id: 7, name: "Công nghệ", path: "/7/" },
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ admin: { learning: { quizzes: { list: { invalidate: mocks.invalidate }, detail: { invalidate: mocks.invalidate } }, topics: { tree: { invalidate: mocks.invalidate } } } } }),
    admin: {
      learning: {
        topics: { tree: { useQuery: () => ({ data: { items: [{ id: 7, name: "Công nghệ", depth: 0 }] } }) } },
        quizzes: {
          list: { useQuery: () => ({ data: { items: [mocks.pendingQuiz], pagination: { page: 1, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false } }, isLoading: false, isError: false, refetch: vi.fn() }) },
          detail: { useQuery: () => ({ data: { quiz: mocks.pendingQuiz, topic: mocks.pendingQuiz.topic, author: mocks.pendingQuiz.author, questions: [{ link: { sortOrder: 0 }, question: { id: 9, prompt: "Mật khẩu mạnh cần có gì?", type: "single", explanation: "Cần dùng mật khẩu đủ dài và khó đoán." }, options: [{ id: 1, body: "Ít nhất 12 ký tự", isCorrect: true }, { id: 2, body: "Chỉ dùng ngày sinh", isCorrect: false }] }], attemptCount: 0 }, isLoading: false }) },
          create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
          publish: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
          reviewReject: { useMutation: () => ({ isPending: false, mutate: mocks.reviewReject }) },
          lock: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
          unlock: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
          archive: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
          changeAuthor: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
          changePublishDate: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
        },
        questions: { reorder: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } },
      },
      users: { useQuery: () => ({ data: { items: [] } }) },
    },
  },
}));

import QuizSystemPanel from "../client/src/components/QuizSystemPanel";

describe("QuizSystemPanel moderation", () => {
  it("xem trước Quiz chờ duyệt và buộc nhập lý do trước khi từ chối", async () => {
    const user = userEvent.setup();
    render(<QuizSystemPanel />);

    expect(screen.getAllByText("Chờ duyệt").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Xem trước kiểm duyệt Kiểm tra an toàn thông tin" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Xem trước kiểm duyệt")).toBeTruthy();
    expect(screen.getByText("Mật khẩu mạnh cần có gì?")).toBeTruthy();
    expect(screen.getByText("Ít nhất 12 ký tự")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Từ chối" }));
    expect(screen.getByRole("heading", { name: "Từ chối Quiz" })).toBeTruthy();
    const rejectButton = screen.getByRole("button", { name: "Từ chối Quiz" });
    expect((rejectButton as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByRole("textbox", { name: "Lý do từ chối *" }), "Bổ sung đáp án đúng cho câu 1.");
    expect((rejectButton as HTMLButtonElement).disabled).toBe(false);
    await user.click(rejectButton);
    expect(mocks.reviewReject).toHaveBeenCalledWith({ quizId: 41, version: 3, reason: "Bổ sung đáp án đúng cho câu 1." });
  });
});
