// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  categories: { data: [] as unknown[], isLoading: false, error: null as Error | null, refetch: vi.fn() },
  catalog: { data: [] as unknown[], isLoading: false, error: null as Error | null, refetch: vi.fn() },
  learner: { data: undefined, isLoading: false, error: null as Error | null, refetch: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    learner: { summary: { useQuery: () => mocks.learner } },
    catalog: {
      categories: { useQuery: () => mocks.categories },
      list: { useQuery: () => mocks.catalog },
    },
  },
}));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import QuizLibrary from "../client/src/pages/QuizLibrary";

describe("QuizLibrary component", () => {
  beforeEach(() => {
    mocks.catalog.data = [];
    mocks.catalog.isLoading = false;
    mocks.catalog.error = null;
    mocks.catalog.refetch.mockReset();
    mocks.categories.data = [];
  });

  afterEach(cleanup);

  it("công bố lỗi catalog và cho phép thử lại", async () => {
    const user = userEvent.setup();
    mocks.catalog.error = new Error("Không thể kết nối thư viện");
    render(<QuizLibrary />);
    expect(screen.getByRole("alert").textContent).toContain("Không thể kết nối thư viện");
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(mocks.catalog.refetch).toHaveBeenCalledTimes(1);
  });

  it("gắn nhãn tìm kiếm và trạng thái được chọn cho bộ lọc mặc định", () => {
    render(<QuizLibrary />);
    expect(screen.getByLabelText("Tìm kiếm bộ đề")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Tất cả" }).every(button => button.getAttribute("aria-pressed") === "true")).toBe(true);
  });
});
