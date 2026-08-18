// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({ trpc: { ai: { assist: { useMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }) } } } }));
vi.mock("@/components/AIChatBox", () => ({ AIChatBox: () => <div>Khung hội thoại AI</div> }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

import { QuizAIStudyAssistant } from "../client/src/components/QuizAIStudyAssistant";

describe("QuizAIStudyAssistant quota feedback", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.toastError.mockReset();
  });

  afterEach(cleanup);

  it("hiển thị chính xác lỗi quota từ máy chủ", async () => {
    const user = userEvent.setup();
    mocks.mutateAsync.mockRejectedValue(new Error("Bạn đã dùng hết quota AI Credits (20/tháng) của gói BASIC."));
    render(<QuizAIStudyAssistant question={{ questionId: 1, prompt: "Câu hỏi kiểm thử quota" }} />);
    await user.click(screen.getByRole("button", { name: "Giải thích với AI" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Không thể dùng trợ lý AI", { description: "Bạn đã dùng hết quota AI Credits (20/tháng) của gói BASIC." }));
  });
});
