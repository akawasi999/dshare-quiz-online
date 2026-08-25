// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  categories: { data: [] as unknown[], isLoading: false, error: null as Error | null, refetch: vi.fn() },
  catalog: { data: [] as unknown[], isLoading: false, error: null as Error | null, refetch: vi.fn() },
  learner: { data: undefined, isLoading: false, error: null as Error | null, refetch: vi.fn() },
  quota: { data: undefined as unknown, isLoading: false, error: null as Error | null, refetch: vi.fn() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/components/SiteHeader", () => ({ default: () => <header data-testid="site-header">Header</header> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    learner: { summary: { useQuery: () => mocks.learner }, quota: { useQuery: () => mocks.quota } },
    catalog: {
      categories: { useQuery: () => mocks.categories },
      topics: { useQuery: () => mocks.categories },
      list: { useQuery: () => mocks.catalog },
    },
  },
}));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import QuizLibrary from "../client/src/pages/QuizLibrary";

describe("QuizLibrary component", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.catalog.data = [];
    mocks.catalog.isLoading = false;
    mocks.catalog.error = null;
    mocks.catalog.refetch.mockReset();
    mocks.categories.data = [];
    mocks.quota.data = undefined;
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

  it("hiển thị hàng chủ đề và trạng thái được chọn cho bộ lọc mặc định", () => {
    render(<QuizLibrary />);
    expect(screen.queryByLabelText("Tìm kiếm bộ đề")).toBeNull();
    expect(screen.queryByLabelText("Sắp xếp bộ đề")).toBeNull();
    expect(screen.queryByText(/^\d+ bộ đề phù hợp$/)).toBeNull();
    expect(screen.getByText("Chủ đề")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Tất cả" }).every(button => button.getAttribute("aria-pressed") === "true")).toBe(true);
  });

  it("hiển thị CTA nâng cấp khi quota lượt làm sắp hết", () => {
    mocks.quota.data = { limits: { attemptsPerMonth: 20 }, usage: { attempts: 18 }, remaining: { attempts: 2 }, tier: "basic" };
    render(<QuizLibrary />);
    expect(screen.getByRole("link", { name: /nâng cấp ngay/i }).getAttribute("href")).toBe("/pricing");
    expect(screen.queryByText("Tiến độ")).toBeNull();
  });

  it("giữ Khám phá công khai có Header nhưng ẩn Header khi được nhúng vào không gian Làm Quiz", () => {
    const { rerender } = render(<QuizLibrary />);
    expect(screen.getByTestId("site-header")).toBeTruthy();

    rerender(<QuizLibrary embedded />);
    expect(screen.queryByTestId("site-header")).toBeNull();
  });

  it("loại bỏ banner theo lộ trình và luyện câu sai ở cả hai biến thể thư viện", () => {
    const { rerender } = render(<QuizLibrary />);
    expect(screen.queryByText("Theo dõi lộ trình để nhận đề phù hợp.")).toBeNull();
    expect(screen.queryByRole("link", { name: /mở hồ sơ học tập/i })).toBeNull();

    rerender(<QuizLibrary embedded />);
    expect(screen.queryByText("Ôn lại những câu bạn chưa đúng.")).toBeNull();
    expect(screen.queryByRole("link", { name: /luyện câu sai/i })).toBeNull();
  });

  it("chỉ hiển thị Chủ đề gốc CPanel và lọc Quiz bằng rootTopicId thay vì tên legacy", async () => {
    const user = userEvent.setup();
    mocks.categories.data = [
      { id: 10, name: "Công nghệ thông tin", slug: "cong-nghe-thong-tin", parentId: null, depth: 0 },
      { id: 11, name: "Lập trình Python", slug: "lap-trinh-python", parentId: 10, depth: 1 },
      { id: 20, name: "Ngoại ngữ", slug: "ngoai-ngu", parentId: null, depth: 0 },
    ];
    mocks.catalog.data = [
      {
        quizId: 101,
        title: "Python cơ bản",
        summary: null,
        mode: "training",
        difficulty: "easy",
        accessTier: "basic",
        durationSeconds: 900,
        questionCount: 10,
        entryPointCost: 0,
        completionReward: 10,
        attemptCount: 0,
        recentAttemptCount: 0,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        coverImageUrl: null,
        topicId: 11,
        topicTitle: "Lập trình Python",
        rootTopicId: 10,
        rootTopicTitle: "Công nghệ thông tin",
        categoryTitle: "Danh mục cũ không khớp",
        subjectTitle: "Python",
        lessonTitle: "Cơ bản",
      },
      {
        quizId: 102,
        title: "Tiếng Anh giao tiếp",
        summary: null,
        mode: "training",
        difficulty: "easy",
        accessTier: "basic",
        durationSeconds: 900,
        questionCount: 10,
        entryPointCost: 0,
        completionReward: 10,
        attemptCount: 0,
        recentAttemptCount: 0,
        createdAt: new Date("2026-08-02T00:00:00.000Z"),
        coverImageUrl: null,
        topicId: 20,
        topicTitle: "Ngoại ngữ",
        rootTopicId: 20,
        rootTopicTitle: "Ngoại ngữ",
        categoryTitle: "Danh mục cũ khác",
        subjectTitle: "Tiếng Anh",
        lessonTitle: "Giao tiếp",
      },
    ];

    render(<QuizLibrary />);

    const topicButtons = screen.getAllByRole("button");
    const technologyChip = topicButtons.find(button => button.textContent?.includes("Công nghệ thông tin"));
    expect(technologyChip).toBeTruthy();
    expect(topicButtons.some(button => button.textContent?.includes("Lập trình Python"))).toBe(false);
    expect(screen.getByText("Python cơ bản")).toBeTruthy();
    expect(screen.getByText("Tiếng Anh giao tiếp")).toBeTruthy();

    await user.click(technologyChip!);
    expect(screen.getByText("Python cơ bản")).toBeTruthy();
    expect(screen.queryByText("Tiếng Anh giao tiếp")).toBeNull();
  });
});
