// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mine: { data: [], isLoading: false, error: null, refetch: vi.fn() },
  quota: { data: { tier: "basic", limits: { quizzesPerMonth: 2 }, usage: { quizzes: 0 } }, isLoading: false, error: null, refetch: vi.fn() },
  content: { data: { categories: [], subjects: [{ id: 1, title: "Tin học" }], lessons: [{ id: 7, subjectId: 1, title: "Excel cơ bản" }] }, isLoading: false, error: null },
  create: { mutate: vi.fn(), isPending: false },
}));

vi.mock("@/components/AccountLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({ trpc: { creator: { contentOptions: { useQuery: () => mocks.content }, myQuizzes: { useQuery: () => mocks.mine }, uploadCover: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, createQuiz: { useMutation: () => mocks.create }, generateQuestionAI: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } }, learner: { quota: { useQuery: () => mocks.quota } }, useUtils: () => ({ creator: { myQuizzes: { invalidate: vi.fn() } } }) } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import UserQuizCreator from "../client/src/pages/UserQuizCreator";

describe("UserQuizCreator thiết kế lại", () => {
  afterEach(cleanup);

  it("mở màn chọn tạo thủ công hoặc AI mà không yêu cầu nhập ID", () => {
    render(<UserQuizCreator />);
    expect(screen.getByText("Tạo Quiz thủ công")).toBeTruthy();
    expect(screen.getByText("Tạo Quiz bằng AI")).toBeTruthy();
    expect(screen.queryByText("ID Bài học")).toBeNull();
  });

  it("mở trình soạn thủ công với metadata, bảo mật và sáu loại câu hỏi", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Bắt đầu tạo thủ công" }));
    expect(screen.getByText("Thông tin Quiz")).toBeTruthy();
    expect(screen.getByText("Cấu hình làm bài & bảo mật")).toBeTruthy();
    expect(screen.getByText("Trình soạn câu hỏi")).toBeTruthy();
    expect(screen.queryByText("ID Bài học")).toBeNull();
    expect(screen.getByRole("option", { name: "Tự luận" })).toBeTruthy();
  });

  it("mở khung chat AI và phần xem trước câu hỏi", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);
    await user.click(screen.getByRole("button", { name: "Khởi tạo bằng AI" }));
    expect(screen.getByText("Dshare AI Assistant")).toBeTruthy();
    expect(screen.getByText("Câu hỏi đã tạo")).toBeTruthy();
  });
});
