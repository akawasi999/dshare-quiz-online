// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mine: { data: undefined, isLoading: false, error: new Error("Không thể đồng bộ danh sách"), refetch: vi.fn() },
  quota: { data: { tier: "basic", limits: { quizzesPerMonth: 2 }, usage: { quizzes: 0 } }, isLoading: false, error: null, refetch: vi.fn() },
}));

vi.mock("@/components/AccountLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({ trpc: { creator: { myQuizzes: { useQuery: () => mocks.mine }, uploadCover: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) }, createQuiz: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) } }, learner: { quota: { useQuery: () => mocks.quota } } } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import UserQuizCreator from "../client/src/pages/UserQuizCreator";

describe("UserQuizCreator data state", () => {
  beforeEach(() => mocks.mine.refetch.mockReset());
  afterEach(cleanup);

  it("công bố lỗi danh sách quiz riêng và cho phép thử lại", async () => {
    const user = userEvent.setup();
    render(<UserQuizCreator />);

    expect(screen.getByRole("alert").textContent).toContain("Không thể đồng bộ danh sách");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.mine.refetch).toHaveBeenCalledTimes(1);
  });
});
