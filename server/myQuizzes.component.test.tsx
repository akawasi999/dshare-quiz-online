// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setLocation: vi.fn(), data: [{ id: 1, title: "Ôn tập Sinh học 10", summary: "Hệ thống câu hỏi tế bào", coverImageUrl: null, questionCount: 12, durationSeconds: 900, isPublished: false, updatedAt: new Date("2026-08-20T00:00:00.000Z") }, { id: 2, title: "Lịch sử Việt Nam", summary: "Quiz đã công khai", coverImageUrl: null, questionCount: 8, durationSeconds: 600, isPublished: true, updatedAt: new Date("2026-08-19T00:00:00.000Z") }] }));

vi.mock("@/components/AccountLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({ trpc: { creator: { myQuizzes: { useQuery: () => ({ data: mocks.data, isLoading: false }) } } } }));
vi.mock("wouter", () => ({ useLocation: () => ["/quiz-cua-toi", mocks.setLocation] }));

import MyQuizzes from "../client/src/pages/MyQuizzes";

describe("MyQuizzes", () => {
  it("hiển thị Quiz của tôi, lọc trạng thái và điều hướng tạo mới", async () => {
    const user = userEvent.setup();
    render(<MyQuizzes />);
    expect(screen.getByRole("heading", { name: "Quiz của tôi" })).toBeTruthy();
    expect(screen.getByText("Ôn tập Sinh học 10")).toBeTruthy();
    expect(screen.getByText("Lịch sử Việt Nam")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Bản nháp" }));
    expect(screen.getByText("Ôn tập Sinh học 10")).toBeTruthy();
    expect(screen.queryByText("Lịch sử Việt Nam")).toBeNull();
    await user.click(screen.getAllByRole("button", { name: "Tạo Quiz mới" })[0]!);
    expect(mocks.setLocation).toHaveBeenCalledWith("/tao-quiz");
  });
});
