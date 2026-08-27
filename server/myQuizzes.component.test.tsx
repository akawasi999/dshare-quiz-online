// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setLocation: vi.fn(), duplicate: vi.fn(), remove: vi.fn(), data: [{ id: 1, title: "Ôn tập Sinh học 10", summary: "Hệ thống câu hỏi tế bào", coverImageUrl: null, questionCount: 12, durationSeconds: 900, isPublished: false, status: "draft", updatedAt: new Date("2026-08-20T00:00:00.000Z") }, { id: 2, title: "Lịch sử Việt Nam", summary: "Quiz đã công khai", coverImageUrl: null, questionCount: 8, durationSeconds: 600, isPublished: true, status: "published", updatedAt: new Date("2026-08-19T00:00:00.000Z") }, { id: 3, title: "Đề cần chỉnh sửa", summary: "Quiz đang phản hồi", coverImageUrl: null, questionCount: 5, durationSeconds: 600, isPublished: false, status: "rejected", reviewReason: "Bổ sung đáp án đúng cho câu 3.", reviewedAt: new Date("2026-08-21T00:00:00.000Z"), updatedAt: new Date("2026-08-21T00:00:00.000Z") }] }));

vi.mock("@/components/AccountLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({ trpc: { creator: { myQuizzes: { useQuery: () => ({ data: mocks.data, isLoading: false }) }, duplicateQuiz: { useMutation: () => ({ isPending: false, mutate: mocks.duplicate }) }, deleteQuiz: { useMutation: () => ({ isPending: false, mutate: mocks.remove }) } }, useUtils: () => ({ creator: { myQuizzes: { invalidate: vi.fn() } } }) } }));
vi.mock("wouter", () => ({ useLocation: () => ["/my-quizzes", mocks.setLocation] }));

import MyQuizzes from "../client/src/pages/MyQuizzes";

describe("MyQuizzes", () => {
  it("hiển thị Quiz của tôi, lọc trạng thái và điều hướng tạo mới", async () => {
    const user = userEvent.setup();
    render(<MyQuizzes />);
    expect(screen.getByRole("heading", { name: "Quiz của tôi" })).toBeTruthy();
    const statsPanel = screen.getByText("Tổng Quiz").closest("section");
    expect(statsPanel?.className).toContain("hidden");
    expect(statsPanel?.className).toContain("sm:grid");
    expect(screen.getByText("Ôn tập Sinh học 10")).toBeTruthy();
    expect(screen.getByText("Lịch sử Việt Nam")).toBeTruthy();
    expect(screen.getByText("Đề cần chỉnh sửa")).toBeTruthy();
    expect(screen.getByTestId("my-quizzes-filter").className).toContain("my-quizzes-filter");
    expect(screen.getByTestId("my-quiz-card-1").className).toContain("my-quiz-card");
    expect(screen.getByText("Bổ sung đáp án đúng cho câu 3.")).toBeTruthy();
    await user.type(screen.getByRole("textbox", { name: "Tìm kiếm Quiz của tôi" }), "lịch sử");
    expect(screen.queryByText("Ôn tập Sinh học 10")).toBeNull();
    expect(screen.getByText("Lịch sử Việt Nam")).toBeTruthy();
    await user.clear(screen.getByRole("textbox", { name: "Tìm kiếm Quiz của tôi" }));
    await user.click(screen.getByRole("button", { name: "Thao tác Quiz Ôn tập Sinh học 10" }));
    expect(screen.getByText("Sửa đổi")).toBeTruthy();
    expect(screen.getAllByText("Sao chép").length).toBeGreaterThan(1);
    expect(screen.getByText("Xóa")).toBeTruthy();
    await user.keyboard("{Escape}");
    const draftFilter = screen.getAllByText("Bản nháp").find(element => element.tagName === "BUTTON");
    await user.click(draftFilter!);
    expect(screen.getByText("Ôn tập Sinh học 10")).toBeTruthy();
    expect(screen.queryByText("Lịch sử Việt Nam")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Cần sửa" }));
    expect(screen.getByText("Đề cần chỉnh sửa")).toBeTruthy();
    expect(screen.getByText("Bổ sung đáp án đúng cho câu 3.")).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Tạo Quiz mới" })[0]!);
    expect(mocks.setLocation).toHaveBeenCalledWith("/build");
  });
});
