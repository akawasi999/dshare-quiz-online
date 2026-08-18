// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  practiceQuery: { data: [] as unknown[], isLoading: false, isError: false, refetch: vi.fn() },
  completePractice: { isPending: false, mutate: vi.fn() },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    quiz: {
      practiceWrong: { useQuery: () => mocks.practiceQuery },
      completePractice: { useMutation: () => mocks.completePractice },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));

import Practice from "../client/src/pages/Practice";

type QuestionType = "single" | "multiple" | "true_false" | "fill_blank" | "image" | "matching";

function practiceItem(type: QuestionType, overrides: Record<string, unknown> = {}) {
  return {
    question: {
      id: 101,
      type,
      difficulty: "medium",
      prompt: "Câu hỏi kiểm thử Practice",
      explanation: "Giải thích kiểm thử.",
      answerConfig: type === "fill_blank" ? { acceptedAnswers: ["Đúng"] } : type === "matching" ? { pairs: [{ left: "Nước", right: "H2O" }] } : {},
      imageUrl: type === "image" ? "https://example.test/practice.png" : null,
      ...overrides,
    },
    category: { id: 1, title: "Chứng chỉ IC3" },
    options: type === "matching" ? [] : [
      { id: 1, body: "Đúng", isCorrect: true },
      { id: 2, body: "Sai", isCorrect: false },
    ],
  };
}

function setPractice(items: unknown[]) {
  mocks.practiceQuery.data = items;
}

describe("Practice component", () => {
  beforeEach(() => {
    mocks.practiceQuery.isLoading = false;
    mocks.practiceQuery.isError = false;
    mocks.practiceQuery.refetch.mockReset();
    mocks.completePractice.isPending = false;
    mocks.completePractice.mutate.mockImplementation((_input, callbacks) => callbacks?.onSuccess?.({ category: { categoryTitle: "Chứng chỉ IC3" } }));
  });

  afterEach(() => {
    cleanup();
    mocks.completePractice.mutate.mockReset();
  });

  it("hiển thị trạng thái trống có CTA khi không có câu cần ôn", () => {
    setPractice([]);
    render(<Practice />);
    expect(screen.getByRole("heading", { name: "Chưa có câu cần ôn" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Khám phá bộ đề" }).getAttribute("href")).toBe("/kham-pha");
  });

  it("chấm ngay single và hiển thị thẻ hoàn thành cùng CTA điều hướng", async () => {
    const user = userEvent.setup();
    setPractice([practiceItem("single")]);
    render(<Practice />);
    await user.click(screen.getByRole("button", { name: "Đúng" }));
    expect(screen.getByText("Chính xác.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Hoàn tất luyện tập/ }));
    expect(mocks.completePractice.mutate).toHaveBeenCalledWith({ questionId: 101 }, expect.any(Object));
    expect(screen.getByRole("heading", { name: "Bạn đã hoàn thành phiên luyện tập" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Khám phá bộ đề/ }).getAttribute("href")).toBe("/kham-pha");
  });

  it("yêu cầu xác nhận câu multiple trước khi phản hồi đáp án", async () => {
    const user = userEvent.setup();
    setPractice([practiceItem("multiple")]);
    render(<Practice />);
    await user.click(screen.getByRole("button", { name: "Đúng" }));
    expect(screen.queryByText("Chính xác.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Kiểm tra đáp án" }));
    expect(screen.getByText("Chính xác.")).toBeTruthy();
  });

  it("chấm đúng/sai, điền từ và hình ảnh theo từng trải nghiệm tương tác", async () => {
    const user = userEvent.setup();
    setPractice([practiceItem("true_false")]);
    const first = render(<Practice />);
    await user.click(screen.getByRole("button", { name: "Đúng" }));
    expect(screen.getByText("Chính xác.")).toBeTruthy();
    first.unmount();

    setPractice([practiceItem("fill_blank")]);
    render(<Practice />);
    await user.type(screen.getByLabelText("Câu trả lời của bạn"), "  đúng  ");
    await user.click(screen.getByRole("button", { name: "Kiểm tra đáp án" }));
    expect(screen.getByText("Chính xác.")).toBeTruthy();
    cleanup();

    setPractice([practiceItem("image")]);
    render(<Practice />);
    expect(screen.getByAltText("Minh họa cho câu hỏi luyện tập")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Đúng" }));
    expect(screen.getByText("Chính xác.")).toBeTruthy();
  });

  it("hỗ trợ chọn và thả bằng chuột hoặc bàn phím cho matching, rồi cho chuyển bước", async () => {
    const user = userEvent.setup();
    setPractice([practiceItem("matching")]);
    render(<Practice />);
    await user.click(screen.getByRole("button", { name: "H2O" }));
    await user.click(screen.getByRole("button", { name: /Ghép “H2O” vào hàng này/ }));
    expect(screen.getByText(/Ghép đúng: H2O/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Hoàn tất luyện tập/ }));
    expect(screen.getByRole("heading", { name: "Bạn đã hoàn thành phiên luyện tập" })).toBeTruthy();
  });

  it("cho phép thả phương án matching bằng drag-and-drop", () => {
    setPractice([practiceItem("matching")]);
    render(<Practice />);
    const source = screen.getByRole("button", { name: "H2O" });
    const target = screen.getByRole("button", { name: "Kéo phương án từ cột phải vào đây" });
    fireEvent.dragStart(source, { dataTransfer: { setData: vi.fn() } });
    fireEvent.drop(target, { dataTransfer: { getData: () => "101-0" } });
    expect(screen.getByText(/Ghép đúng: H2O/)).toBeTruthy();
  });
});
